# Klivora Docker Setup

## Quick Start

### 1. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Start Development Environment
```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

### 3. Start Production Environment
```bash
docker-compose up -d
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 3001 | REST API |
| Web Frontend | 80/443 | React app via Nginx |
| Redis | 6379 | Caching/sessions |

## Useful Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f web

# Rebuild and restart
docker-compose up -d --build

# Stop all
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Run migrations (if using local DB)
docker-compose exec backend npm run migrate

# Run cron jobs manually
docker-compose exec cron node scripts/process-recurring-invoices.js
docker-compose exec cron node scripts/check-overdue-invoices.js
```

## Environment Variables

Required variables (see `.env.example`):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `FRONTEND_URL` - Your frontend domain (for CORS)
- `STRIPE_SECRET_KEY` - Stripe secret key (for payments)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `RESEND_API_KEY` - Resend API key (for emails)
- `FROM_EMAIL` - Sender email address

## Database

The application uses Supabase (PostgreSQL) as the primary database. Run the schema from `database/schema.sql` in your Supabase SQL Editor.

For local development with a local PostgreSQL, uncomment the `db` service in `docker-compose.yml`.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci-cd.yml`) handles:
- Linting and type checking
- Running tests
- Building Docker images
- Pushing to GHCR
- Deploying to staging (on develop branch)
- Deploying to production (on main branch)

## Cron Jobs

The `cron` service runs:
- **Daily at 00:00 UTC**: Process recurring invoices
- **Daily at 09:00 UTC**: Check for overdue invoices

You can also run these manually:
```bash
node backend/scripts/process-recurring-invoices.js
node backend/scripts/check-overdue-invoices.js
```

Or via Supabase pg_cron (see `database/cron_jobs.sql`).