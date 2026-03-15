"""
Seed Postgres/pgvector with LightGCN embeddings and index data.

Usage (from project root):
    uv run python scripts/seed_db.py [--reset]

Reads DATABASE_URL from frontend/.env (falls back to env var).
Pass --reset to truncate all tables before inserting.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Env / deps
# ---------------------------------------------------------------------------
ROOT = Path(__file__).parent.parent
DATA = ROOT / "data"

def _load_env() -> str:
    """Return DATABASE_URL from frontend/.env or environment."""
    env_file = ROOT / "frontend" / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        sys.exit(
            "DATABASE_URL not found.\n"
            "Create frontend/.env with DATABASE_URL=postgresql://... "
            "or set the env var."
        )
    return url


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed LightGCN data into Postgres")
    parser.add_argument("--reset", action="store_true", help="Truncate tables before seeding")
    args = parser.parse_args()

    try:
        import numpy as np
        import pandas as pd
        import psycopg2
        import psycopg2.extras
    except ImportError as e:
        sys.exit(f"Missing dependency: {e}\nRun: uv add psycopg2-binary numpy pandas")

    db_url = _load_env()

    print("Connecting to database…")
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()

    # ------------------------------------------------------------------
    # Ensure pgvector extension + tables exist
    # ------------------------------------------------------------------
    print("Enabling pgvector extension…")
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_idx    INTEGER PRIMARY KEY,
            sha1        TEXT    NOT NULL UNIQUE,
            embedding   vector(64) NOT NULL,
            display_name TEXT,
            email       TEXT UNIQUE,
            avatar_url  TEXT,
            country     TEXT,
            created_at  TIMESTAMPTZ
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS artists (
            item_idx   INTEGER PRIMARY KEY,
            mbid       TEXT    NOT NULL UNIQUE,
            name       TEXT    NOT NULL,
            embedding  vector(64) NOT NULL,
            total_plays INTEGER NOT NULL DEFAULT 0
        )
    """)

    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ")
    cur.execute("ALTER TABLE artists ADD COLUMN IF NOT EXISTS total_plays INTEGER NOT NULL DEFAULT 0")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS train_edges (
            user_idx   INTEGER NOT NULL,
            item_idx   INTEGER NOT NULL,
            plays      INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (user_idx, item_idx)
        )
    """)
    cur.execute("ALTER TABLE train_edges ADD COLUMN IF NOT EXISTS plays INTEGER NOT NULL DEFAULT 1")
    conn.commit()

    # ------------------------------------------------------------------
    # Optionally truncate
    # ------------------------------------------------------------------
    if args.reset:
        print("Truncating tables…")
        cur.execute("TRUNCATE train_edges, users, artists")
        conn.commit()

    # ------------------------------------------------------------------
    # Load source files
    # ------------------------------------------------------------------
    print("Loading source files…")
    emb       = np.load(DATA / "model" / "embeddings.npz")
    user_emb  = emb["user_emb"].astype("float32")   # (n_users, 64)
    item_emb  = emb["item_emb"].astype("float32")   # (n_items, 64)

    user_idx_df  = pd.read_csv(DATA / "model" / "user_index.csv")
    item_idx_df  = pd.read_csv(DATA / "model" / "item_index.csv")
    train_df     = pd.read_csv(DATA / "rec_train_edges.csv")

    n_users, n_items = user_emb.shape[0], item_emb.shape[0]
    print(f"  users : {n_users}  |  artists : {n_items}  |  edges : {len(train_df)}")

    def fmt_vec(arr: "np.ndarray") -> str:
        """Format a 1-D float array as a pgvector literal '[x,y,z,…]'."""
        return "[" + ",".join(f"{v:.8f}" for v in arr.tolist()) + "]"

    BATCH = 500

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------
    print("Seeding users…")
    t0 = time.time()
    user_rows = [
        (int(row.user_idx), str(row.user_sha1), fmt_vec(user_emb[int(row.user_idx)]))
        for _, row in user_idx_df.iterrows()
    ]
    for i in range(0, len(user_rows), BATCH):
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO users (user_idx, sha1, embedding)
            VALUES %s
            ON CONFLICT (user_idx) DO UPDATE
              SET sha1 = EXCLUDED.sha1,
                  embedding = EXCLUDED.embedding
            """,
            user_rows[i : i + BATCH],
            template="(%s, %s, %s::vector)",
        )
    conn.commit()
    print(f"  done in {time.time()-t0:.1f}s")

    # ------------------------------------------------------------------
    # Artists (with total_plays from item_index if present)
    # ------------------------------------------------------------------
    print("Seeding artists…")
    t0 = time.time()
    total_plays_col = "total_plays" if "total_plays" in item_idx_df.columns else None
    artist_rows = [
        (
            int(row.item_idx),
            str(row.artist_mbid),
            str(row.artist_name),
            fmt_vec(item_emb[int(row.item_idx)]),
            int(getattr(row, total_plays_col, 0) or 0) if total_plays_col else 0,
        )
        for _, row in item_idx_df.iterrows()
    ]
    for i in range(0, len(artist_rows), BATCH):
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO artists (item_idx, mbid, name, embedding, total_plays)
            VALUES %s
            ON CONFLICT (item_idx) DO UPDATE
              SET mbid        = EXCLUDED.mbid,
                  name        = EXCLUDED.name,
                  embedding   = EXCLUDED.embedding,
                  total_plays = EXCLUDED.total_plays
            """,
            artist_rows[i : i + BATCH],
            template="(%s, %s, %s, %s::vector, %s)",
        )
    conn.commit()
    print(f"  done in {time.time()-t0:.1f}s")

    # ------------------------------------------------------------------
    # Training edges (with plays from CSV if present)
    # ------------------------------------------------------------------
    print("Seeding train_edges…")
    t0 = time.time()
    if "plays" in train_df.columns:
        edge_rows = list(
            train_df[["user_idx", "item_idx", "plays"]].itertuples(index=False, name=None)
        )
        edge_template = "(%s, %s, %s)"
        edge_cols = "(user_idx, item_idx, plays)"
    else:
        edge_rows = [
            (*t, 1) for t in train_df[["user_idx", "item_idx"]].itertuples(index=False, name=None)
        ]
        edge_template = "(%s, %s, %s)"
        edge_cols = "(user_idx, item_idx, plays)"
    EDGE_BATCH = 2000
    for i in range(0, len(edge_rows), EDGE_BATCH):
        psycopg2.extras.execute_values(
            cur,
            f"""
            INSERT INTO train_edges {edge_cols}
            VALUES %s
            ON CONFLICT (user_idx, item_idx) DO UPDATE SET plays = EXCLUDED.plays
            """,
            edge_rows[i : i + EDGE_BATCH],
            template=edge_template,
        )
    conn.commit()
    print(f"  done in {time.time()-t0:.1f}s")

    # ------------------------------------------------------------------
    # Vector indexes (IVFFlat — built after data is loaded)
    # ------------------------------------------------------------------
    print("Building pgvector indexes…")
    t0 = time.time()

    # Inner-product index for recommendations
    cur.execute("""
        CREATE INDEX IF NOT EXISTS artists_emb_ip_idx
        ON artists USING ivfflat (embedding vector_ip_ops)
        WITH (lists = 50)
    """)
    # Cosine index for similar-artist lookups
    cur.execute("""
        CREATE INDEX IF NOT EXISTS artists_emb_cos_idx
        ON artists USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 50)
    """)
    conn.commit()
    print(f"  done in {time.time()-t0:.1f}s")

    cur.close()
    conn.close()
    print("\nSeeding complete!")


if __name__ == "__main__":
    main()
