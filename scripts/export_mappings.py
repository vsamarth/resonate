"""
Export index mappings from the processed Last.fm dataset.

Replays the exact same pipeline as rec_dataset.ipynb to produce:
  data/model/item_index.csv  — item_idx, artist_mbid, artist_name
  data/model/user_index.csv  — user_idx, user_sha1

Run from the project root:
  uv run python scripts/export_mappings.py
"""

from pathlib import Path

import numpy as np
import pandas as pd

DATASET_DIR = Path("dataset")
PLAYS_FILE = DATASET_DIR / "usersha1-artmbid-artname-plays.tsv"
OUT_DIR = Path("data/model")

# Must match rec_dataset.ipynb exactly
NROWS = 100_000
MIN_USER_INTER = 5
MIN_ITEM_INTER = 5
SEED = 42

if not PLAYS_FILE.exists():
    raise FileNotFoundError(f"Raw dataset not found at {PLAYS_FILE}")

print(f"Loading {NROWS:,} rows from {PLAYS_FILE} ...")
plays = pd.read_csv(
    PLAYS_FILE,
    sep="\t",
    nrows=NROWS,
    header=None,
    names=["user_sha1", "artist_mbid", "artist_name", "plays"],
)

# Clean
plays = plays.dropna(subset=["artist_mbid"])
plays = plays[plays["artist_mbid"].astype(str).str.len() > 0]

# One interaction per (user, artist)
edges = plays[["user_sha1", "artist_mbid", "artist_name"]].drop_duplicates(
    subset=["user_sha1", "artist_mbid"]
)
edges = edges.reset_index(drop=True)

# Map to integer indices
user_cats = edges["user_sha1"].astype("category")
item_cats = edges["artist_mbid"].astype("category")
edges["user_idx"] = user_cats.cat.codes.values
edges["item_idx"] = item_cats.cat.codes.values

# Filter by minimum interactions
user_counts = edges["user_idx"].value_counts()
item_counts = edges["item_idx"].value_counts()
keep_users = user_counts[user_counts >= MIN_USER_INTER].index.values
keep_items = item_counts[item_counts >= MIN_ITEM_INTER].index.values

edges = edges[
    edges["user_idx"].isin(keep_users) & edges["item_idx"].isin(keep_items)
].copy()

# Re-map to contiguous indices (must match rec_dataset.ipynb exactly)
old_user_idx = edges["user_idx"].values
old_item_idx = edges["item_idx"].values
_, edges["user_idx"] = np.unique(old_user_idx, return_inverse=True)
_, edges["item_idx"] = np.unique(old_item_idx, return_inverse=True)

n_users = int(edges["user_idx"].max()) + 1
n_items = int(edges["item_idx"].max()) + 1
print(f"After filter: n_users={n_users}, n_items={n_items}, n_edges={len(edges)}")

# Build item_index: one row per item_idx
item_index = (
    edges[["item_idx", "artist_mbid", "artist_name"]]
    .drop_duplicates("item_idx")
    .sort_values("item_idx")
    .reset_index(drop=True)
)

# Build user_index: one row per user_idx
user_index = (
    edges[["user_idx", "user_sha1"]]
    .drop_duplicates("user_idx")
    .sort_values("user_idx")
    .reset_index(drop=True)
)

OUT_DIR.mkdir(parents=True, exist_ok=True)

item_path = OUT_DIR / "item_index.csv"
user_path = OUT_DIR / "user_index.csv"

item_index.to_csv(item_path, index=False)
user_index.to_csv(user_path, index=False)

print(f"\nSaved {len(item_index):,} items  → {item_path}")
print(f"Saved {len(user_index):,} users  → {user_path}")

print("\nSample item_index (first 5):")
print(item_index.head().to_string(index=False))

print("\nSample user_index (first 10):")
print(user_index.head(10).to_string(index=False))
