"""
Populate personal profile fields for the top 100 users (user_idx 0..99)
using Faker. Run after seed_db.py.

Usage (from project root):
    uv run python scripts/seed_user_profiles.py

Reads DATABASE_URL from frontend/.env or env.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent


def _load_env() -> str:
    env_file = ROOT / "frontend" / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        sys.exit("DATABASE_URL not set. Create frontend/.env or set the env var.")
    return url


def main() -> None:
    try:
        import psycopg2
        from faker import Faker
    except ImportError as e:
        sys.exit(f"Missing dependency: {e}\nRun: uv add faker psycopg2-binary")

    db_url = _load_env()
    fake = Faker()

    print("Connecting and updating top 100 users…")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    for user_idx in range(100):
        display_name = fake.name()
        email = f"{fake.user_name()}{user_idx}@{fake.domain_name()}".lower().replace(" ", ".")
        avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_idx}"
        country = fake.country_code()
        created_at = fake.date_time_between(start_date="-5y", end_date="now")

        cur.execute(
            """
            UPDATE users
            SET display_name = %s, email = %s, avatar_url = %s, country = %s, created_at = %s
            WHERE user_idx = %s
            """,
            (display_name, email, avatar_url, country, created_at, user_idx),
        )

    conn.commit()
    cur.close()
    conn.close()
    print("Done. Top 100 users now have display_name, email, avatar_url, country, created_at.")


if __name__ == "__main__":
    main()
