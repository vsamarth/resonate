"""
LightGCN recommendation API.

Loads pre-computed embeddings once at startup and serves top-k artist
recommendations per user via a single dot-product score computation.

Start from the project root:
  uv run uvicorn backend.main:app --reload --port 8000
"""

from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Paths (relative to project root, where uvicorn is launched from)
# ---------------------------------------------------------------------------
DATA_DIR = Path("data")

EMB_PATH   = DATA_DIR / "model" / "embeddings.npz"
TRAIN_PATH = DATA_DIR / "rec_train_edges.csv"
ITEM_IDX   = DATA_DIR / "model" / "item_index.csv"
USER_IDX   = DATA_DIR / "model" / "user_index.csv"

# ---------------------------------------------------------------------------
# Load data at module import (once per process)
# ---------------------------------------------------------------------------
print("Loading embeddings …")
_emb      = np.load(EMB_PATH)
user_emb  = _emb["user_emb"]   # (n_users, d)  float32
item_emb  = _emb["item_emb"]   # (n_items, d)  float32

N_USERS, EMBED_DIM = user_emb.shape
N_ITEMS             = item_emb.shape[0]
print(f"  user_emb : {user_emb.shape}")
print(f"  item_emb : {item_emb.shape}")

print("Loading training edges …")
train_df = pd.read_csv(TRAIN_PATH)
# Pre-group for fast per-user lookup
_seen_by_user: dict[int, np.ndarray] = {
    uid: grp["item_idx"].values
    for uid, grp in train_df.groupby("user_idx")
}

print("Loading index mappings …")
item_index = pd.read_csv(ITEM_IDX).set_index("item_idx")   # mbid, artist_name
user_index = pd.read_csv(USER_IDX).set_index("user_idx")   # user_sha1

# Reverse lookup: artist_mbid → item_idx
_mbid_to_idx: dict[str, int] = {
    str(row["artist_mbid"]): int(idx)
    for idx, row in item_index.iterrows()
}

# L2-normalised item embeddings for cosine similarity
_item_emb_norm: np.ndarray = item_emb.astype(np.float64)
_norms = np.linalg.norm(_item_emb_norm, axis=1, keepdims=True)
_norms[_norms == 0] = 1.0
_item_emb_norm = _item_emb_norm / _norms

print("Ready.\n")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="LightGCN Recommendation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------
class ArtistItem(BaseModel):
    item_idx: int
    mbid: str
    name: str

class ArtistItemWithScore(ArtistItem):
    score: float

class RecommendationsResponse(BaseModel):
    user_idx: int
    k: int
    items: list[ArtistItemWithScore]

class SimilarArtistsResponse(BaseModel):
    item_idx: int
    k: int
    similar: list[ArtistItemWithScore]

class HealthResponse(BaseModel):
    status: str
    n_users: int
    n_items: int
    embed_dim: int

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        n_users=N_USERS,
        n_items=N_ITEMS,
        embed_dim=EMBED_DIM,
    )


@app.get("/recommendations/{user_idx}", response_model=RecommendationsResponse)
def recommend(user_idx: int, k: int = 10) -> RecommendationsResponse:
    if not (0 <= user_idx < N_USERS):
        raise HTTPException(
            status_code=404,
            detail=f"user_idx {user_idx} out of range [0, {N_USERS - 1}]",
        )
    if not (1 <= k <= N_ITEMS):
        raise HTTPException(
            status_code=422,
            detail=f"k must be between 1 and {N_ITEMS}",
        )

    # Dot-product scores: (d,) @ (d, n_items) → (n_items,)
    scores: np.ndarray = user_emb[user_idx].astype(np.float64) @ item_emb.T.astype(np.float64)

    # Mask items seen during training
    seen = _seen_by_user.get(user_idx, np.array([], dtype=np.int64))
    if len(seen):
        scores[seen] = -np.inf

    # Top-k via partial sort then argsort
    top_k_idx = np.argpartition(scores, -k)[-k:]
    top_k_idx = top_k_idx[np.argsort(scores[top_k_idx])[::-1]]

    items = []
    for idx in top_k_idx:
        row = item_index.loc[idx]
        items.append(
            ArtistItemWithScore(
                item_idx=int(idx),
                mbid=str(row["artist_mbid"]),
                name=str(row["artist_name"]),
                score=float(scores[idx]),
            )
        )

    return RecommendationsResponse(user_idx=user_idx, k=k, items=items)


@app.get("/artists/by-mbid/{mbid}", response_model=ArtistItem)
def get_artist_by_mbid(mbid: str) -> ArtistItem:
    """Look up a dataset artist by MusicBrainz ID."""
    idx = _mbid_to_idx.get(mbid)
    if idx is None:
        raise HTTPException(
            status_code=404,
            detail=f"MBID {mbid!r} not found in dataset",
        )
    row = item_index.loc[idx]
    return ArtistItem(
        item_idx=int(idx),
        mbid=mbid,
        name=str(row["artist_name"]),
    )


@app.get("/similar-artists/{item_idx}", response_model=SimilarArtistsResponse)
def similar_artists(item_idx: int, k: int = 6) -> SimilarArtistsResponse:
    """Return the k most similar artists by cosine similarity in embedding space."""
    if not (0 <= item_idx < N_ITEMS):
        raise HTTPException(
            status_code=404,
            detail=f"item_idx {item_idx} out of range [0, {N_ITEMS - 1}]",
        )
    if not (1 <= k <= N_ITEMS - 1):
        raise HTTPException(
            status_code=422,
            detail=f"k must be between 1 and {N_ITEMS - 1}",
        )

    # Cosine similarity: normalised dot product
    scores: np.ndarray = _item_emb_norm[item_idx] @ _item_emb_norm.T
    scores[item_idx] = -np.inf  # exclude self

    top_k_idx = np.argpartition(scores, -k)[-k:]
    top_k_idx = top_k_idx[np.argsort(scores[top_k_idx])[::-1]]

    similar = []
    for idx in top_k_idx:
        row = item_index.loc[idx]
        similar.append(
            ArtistItemWithScore(
                item_idx=int(idx),
                mbid=str(row["artist_mbid"]),
                name=str(row["artist_name"]),
                score=float(scores[idx]),
            )
        )

    return SimilarArtistsResponse(item_idx=item_idx, k=k, similar=similar)
