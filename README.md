## Resonate — Music Recommendations with LightGCN (SvelteKit)

Resonate is a full-stack SvelteKit app that powers personalized music-artist discovery using a LightGCN-style recommender trained on the Last.fm 360K dataset. It stores artist and user embeddings in PostgreSQL using `pgvector`, then serves recommendations and “Similar Artists” with fast vector similarity queries.

> Demo-friendly: sign in with seeded dataset profiles (no manual user setup required).

## Features

- Personalized “Made For You” recommendations (dataset profile + blended liked-artist signal)
- Dataset profile browsing (select a seeded user profile to simulate listening history)
- Onboarding flow: pick 3–5 artists to personalize recommendations
- Like / unlike artists to refine recommendations
- “Similar Artists” (cosine similarity over embedding space)
- Artist detail page enriched with MusicBrainz, Last.fm images, and Wikipedia extracts

## Tech Stack

- Frontend + routes: `SvelteKit`
- Auth: `better-auth` (email/password + dataset-profile impersonation)
- Database + embeddings: `PostgreSQL` + `pgvector` + `Drizzle ORM`
- Styling/components: `Tailwind CSS`, `bits-ui`, `lucide-svelte`, `embla-carousel-svelte`
- ML/data pipeline: Python in `model/` (training, data prep, and DB seeding with `uv`)

## Live Demo

If you have a public deployment, add it here (recommended for Svelte repo submissions), for example:

- https://your-demo-url.com

## Getting Started

### Prerequisites

- Docker (recommended for local Postgres setup)
- Node tooling: Bun (see `package.json`)
- PostgreSQL with the `vector` extension (`pgvector`)

### 1) Configure environment

Copy the example environment file:

```bash
cp .env.example .env
```

Then set:

- `BETTER_AUTH_SECRET` (min 32 chars)
- `BETTER_AUTH_URL` (typically `http://localhost:5173`)
- `RESONATE_IMPERSONATE_PASSWORD` (min 8 chars; used server-side for demo dataset sign-in)
- `LASTFM_API_KEY` (used for Last.fm artist images)

Optional:

- `WIKIPEDIA_USER_AGENT` (recommended; useful for Wikimedia throttling rules)

### 2) Start Postgres + pgvector

This repo includes a `docker-compose.yml` that provisions `pgvector/pgvector:pg16` and enables the `vector` extension:

```bash
docker compose up -d
```

### 3) Run Drizzle migrations

```bash
bun run db:migrate
```

### 4) Seed the recommendation dataset (embeddings + edges)

All ML training work lives in `model/`. For app development you typically just need to seed embeddings and graph edges into Postgres:

```bash
cd model
uv sync
uv run python scripts/seed_db.py --reset
```

Then populate optional profile fields for the top users:

```bash
uv run python scripts/seed_user_profiles.py
```

### 5) Start the app

```bash
bun install
bun run dev
```

## Onboarding

For newly created / low-activity accounts, the UI shows an onboarding modal to “Pick a few artists you like”.

- Select between `3` and `5` artists
- Submit via `POST /api/me/onboarding` with either:
  - `{"mbids": string[]}` (MusicBrainz artist IDs), or
  - `{"item_idx": number[]}` (catalog indices in the DB)

On success, the app refreshes recommendations (like/embed blending updates).

## Recommendation Model (High Level)

- Embedding dimension: `64`
- Stored embeddings:
  - `artists.embedding` (artist/item vectors)
  - `users.embedding` (dataset user vectors)
- “Made For You” recommendations:
  - Compute an effective user vector by blending:
    - dataset user embedding, and
    - the mean of embeddings of artists the user has liked in-app
  - Exclude items from:
    - `train_edges` (already present in training/listened graph), and
    - `user_artist_likes` (explicit likes)
  - Rank by vector dot-product similarity

“Similar Artists” uses cosine/c-distance style similarity in embedding space and excludes the queried item itself.

## Environment Variables

See `.env.example`. Key variables:

- `DATABASE_URL` (Postgres connection string)
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `RESONATE_IMPERSONATE_PASSWORD` (demo sign-in)
- `LASTFM_API_KEY` (artist imagery)
- Optional: `WIKIPEDIA_USER_AGENT`

## License

This project is licensed under the MIT License. See `LICENSE` for details.

