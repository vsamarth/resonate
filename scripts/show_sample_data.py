#!/usr/bin/env python3
"""Show a clean sample of the Last.fm 360K dataset (plays + user profiles)."""

import csv
from pathlib import Path

DATASET_DIR = Path(__file__).resolve().parent.parent / "dataset"
PLAYS_FILE = DATASET_DIR / "usersha1-artmbid-artname-plays.tsv"
PROFILE_FILE = DATASET_DIR / "usersha1-profile.tsv"

# How many rows to show per table
PLAYS_SAMPLE = 12
PROFILE_SAMPLE = 10


def read_tsv(path: Path, n: int, delimiter: str = "\t") -> list[list[str]]:
    rows = []
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f, delimiter=delimiter)
        for i, row in enumerate(reader):
            if i >= n:
                break
            rows.append(row)
    return rows


def col(lines: list[list[str]], j: int, min_width: int = 2) -> int:
    return max(min_width, max((len(str(row[j])) for row in lines), default=0))


def print_table(title: str, headers: list[str], rows: list[list[str]], max_cell: int = 40):
    if not rows:
        print(f"{title}\n  (no data)\n")
        return
    all_rows = [headers] + rows
    ncols = len(headers)
    widths = [min(max(col(all_rows, j), len(headers[j])), max_cell) for j in range(ncols)]
    width = sum(widths) + (ncols - 1) * 3 + 2  # spaces and borders

    def trunc(s: str, w: int) -> str:
        s = str(s).replace("\n", " ").strip()
        return (s[: w - 1] + "…") if len(s) > w else s

    top = "┌" + "┬".join("─" * (w + 2) for w in widths) + "┐"
    mid = "├" + "┼".join("─" * (w + 2) for w in widths) + "┤"
    bot = "└" + "┴".join("─" * (w + 2) for w in widths) + "┘"

    print()
    print(f"  {title}")
    print(top)
    print("│ " + " │ ".join(trunc(h, widths[i]).ljust(widths[i]) for i, h in enumerate(headers)) + " │")
    print(mid)
    for row in rows:
        padded = []
        for i, cell in enumerate(row):
            if i >= ncols:
                break
            padded.append(trunc(cell, widths[i]).ljust(widths[i]))
        while len(padded) < ncols:
            padded.append(" " * widths[len(padded)])
        print("│ " + " │ ".join(padded[:ncols]) + " │")
    print(bot)
    print()


def main() -> None:
    print("\n  Last.fm 360K — sample data")
    print("  " + "=" * 56)

    if not PLAYS_FILE.exists():
        print(f"\n  Not found: {PLAYS_FILE}")
        return
    if not PROFILE_FILE.exists():
        print(f"\n  Not found: {PROFILE_FILE}")
        return

    plays = read_tsv(PLAYS_FILE, PLAYS_SAMPLE)
    print_table(
        "User → Artist plays (sample)",
        ["user_sha1 (first 12)", "artist_mbid", "artist_name", "plays"],
        [[r[0][:12] + "…", r[1], r[2], r[3]] if len(r) >= 4 else r for r in plays],
        max_cell=28,
    )

    profiles = read_tsv(PROFILE_FILE, PROFILE_SAMPLE)
    print_table(
        "User profiles (sample)",
        ["user_sha1 (first 12)", "gender", "age", "country", "signup"],
        [
            [r[0][:12] + "…", r[1], r[2], r[3], r[4]] if len(r) >= 5 else r
            for r in profiles
        ],
        max_cell=18,
    )

    print("  File locations:")
    print(f"    Plays:   {PLAYS_FILE.name}")
    print(f"    Profile: {PROFILE_FILE.name}")
    print()


if __name__ == "__main__":
    main()
