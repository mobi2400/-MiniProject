# Database Setup and Migrations

This project uses PostgreSQL (hosted on Neon for production and preview environments, or running locally via Docker or local PostgreSQL server).

## Local Development with Docker

To run PostgreSQL locally using Docker:

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container with:
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `miniproject`
- Connection URL: `postgres://postgres:postgres@localhost:5432/miniproject`

Set `DATABASE_URL` in your `.env`:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/miniproject
```

## Running Migrations

Database schema migrations are stored as SQL files in `migrations/` and managed with `scripts/migrate.mjs`.

To run migrations:
```bash
npm run db:migrate
```

The runner:
- Uses `DATABASE_URL_UNPOOLED` if set, otherwise falls back to `DATABASE_URL`.
- Tracks executed migrations in the `schema_migrations` table.
- Executes each pending migration inside an isolated transaction.
- Is idempotent; running it multiple times safely skips already applied migrations.

## Neon & Vercel Configuration

### Environment Variables
- `DATABASE_URL`: Pooled connection string provided by Neon (contains `-pooler` host). Used by the Next.js runtime.
- `DATABASE_URL_UNPOOLED`: Direct (unpooled) connection string. Recommended for running migrations during deploy steps or locally.
- `SESSION_SECRET`: 32+ random base64url bytes.

### Neon Branches
- **Production**: Main branch on Neon.
- **Preview**: Dedicated Neon branch for PRs / preview deployments.

Run `npm run db:migrate` against your target Neon database using the direct connection string before deploying code that expects new migrations.
