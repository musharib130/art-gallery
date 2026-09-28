# Art Gallery

Artists publish galleries of artworks; everyone else browses, likes, comments on, saves and follows them.

- `frontend/` - Next.js 16 (App Router, TypeScript, Tailwind)
- `backend/` - FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, managed with uv (Python 3.11)

## Setup

### Database (local PostgreSQL)

Uses the locally installed PostgreSQL server (port 5433 on this machine), connecting as the `postgres` user. Create the database once:

```sql
CREATE DATABASE artgallery;
```

### Backend

```bash
cd backend
cp .env.example .env        # set the postgres password and a JWT_SECRET
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

Dependencies are managed only through uv: `uv add <pkg>`, `uv add --dev <pkg>`, `uv remove <pkg>`.

### Create an artist

Public signup only creates regular users. Artists are created from the command line:

```bash
cd backend
uv run python -m app.cli create-artist --email jane@example.com --username jane --display-name "Jane Doe"
```

The password is prompted for (or pass `--password`).

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The app runs at http://localhost:3000 and calls the API at `NEXT_PUBLIC_API_URL` (default http://localhost:8000). If you serve it from another origin, add it to `CORS_ORIGINS` in `backend/.env`.

## Tests

```bash
cd backend
uv run pytest
```

Tests create and migrate a separate `artgallery_test` database on each run.

## How it works

| Area | Behavior |
|---|---|
| Accounts | JWT bearer tokens (7 days), Argon2 password hashes. Roles are `artist` and `regular` (Postgres enum). |
| Visitors | Can browse the feed, explore, artists, galleries and artworks without an account. |
| Galleries | Owned by one artist; title, description, cover image. Cannot be deleted while it has artworks. |
| Artworks | Belong to one gallery; 1 to 5 images with exactly one primary. |
| Pricing | USD, stored in cents. For sale requires a price. When not for sale the price is kept but hidden from everyone except the owning artist, and returns when switched back. |
| Engagement | Logged-in users like, save and comment on artworks, and follow artists and galleries. Authors edit/delete their comments; artists can delete comments on their artworks. |
| Feed | Artworks from followed artists and galleries, newest first. Users who follow nobody, and visitors, see all artworks. `/explore` always shows everything. |
| Images | Uploaded to `POST /uploads` (JPEG, PNG, WEBP, GIF; max 10 MB), stored in `backend/media/` and served at `/media/...`. |

## API overview

| Method | Path | Who |
|---|---|---|
| POST | `/auth/signup`, `/auth/login` | anyone |
| GET, PATCH | `/auth/me` | logged in |
| GET | `/feed`, `/explore`, `/artists`, `/galleries` | anyone |
| GET | `/users/{username}`, `/users/{username}/galleries` | anyone |
| PUT, DELETE | `/users/{username}/follow` | logged in |
| POST | `/galleries` | artist |
| GET / PATCH, DELETE | `/galleries/{id}` | anyone / owner |
| GET / POST | `/galleries/{id}/artworks` | anyone / owner |
| PUT, DELETE | `/galleries/{id}/follow` | logged in |
| GET / PATCH, DELETE | `/artworks/{id}` | anyone / owner |
| PUT | `/artworks/{id}/images` | owner (replaces the full image list) |
| PUT, DELETE | `/artworks/{id}/like`, `/artworks/{id}/save` | logged in |
| GET / POST | `/artworks/{id}/comments` | anyone / logged in |
| PATCH, DELETE | `/comments/{id}` | author (delete: author or artwork owner) |
| GET | `/me/saved` | logged in |
| POST | `/uploads` | logged in |
