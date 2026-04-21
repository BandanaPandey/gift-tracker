# Gift Tracker

This repository is split into two deployable apps:

- `gift-tracker-web/` - Next.js frontend
- `gift-tracker-api/` - Ruby on Rails API

The recommended hobby path is:

- frontend on `Vercel Hobby`
- API on `Render Web Service`
- database on `Render Postgres`

This keeps the frontend and backend independently deployable and matches the way the app already works locally.

## Local setup

### API

```bash
cd gift-tracker-api
cp .env.example .env
bundle install
bin/rails db:prepare
bin/rails server -p 3001
```

To test reminder emails locally, keep `ACTION_MAILER_DELIVERY_METHOD=test` and use the dashboard to queue and process reminders manually.

### Web app

```bash
cd gift-tracker-web
cp .env.example .env.local
npm install
npm run dev
```

## Health endpoints

- Rails health check: `GET /up`
- Versioned API health check: `GET /api/v1/health`

## Free hobby deployment guide

### 1. Deploy the Rails API to Render

Create a new `Web Service` in Render and point it at this repository.

The repository now includes a starter Render blueprint at [render.yaml](/Users/Bandana/work/AI/codex/gift-tracker/render.yaml) if you want Render to prefill the API service and Postgres for you.

Recommended service settings:

- Environment: `Ruby`
- Root directory: `gift-tracker-api`
- Build command: `bundle install`
- Start command: `bundle exec rails db:prepare && bundle exec rails server -b 0.0.0.0 -p ${PORT:-3000}`

Required environment variables:

- `DATABASE_URL`
- `FRONTEND_APP_URL`
- `APP_HOST`
- `APP_PROTOCOL`
- `MAILER_FROM_EMAIL`
- `SMTP_ADDRESS`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_AUTHENTICATION`
- `SMTP_ENABLE_STARTTLS_AUTO`
- `RAILS_LOG_LEVEL`

Recommended values:

- `APP_PROTOCOL=https`
- `RAILS_LOG_LEVEL=info`
- `FRONTEND_APP_URL=https://<your-vercel-app>.vercel.app`
- `APP_HOST=<your-render-api-host>.onrender.com`

Notes:

- `FRONTEND_APP_URL` drives production CORS and supports comma-separated origins if you later need multiple frontend URLs.
- The Rails API now fails fast in production if required deployment env vars are missing.
- Render can use the native Ruby runtime for this app; Docker is not required for the hobby path.

### 2. Create Render Postgres

Create a `Render Postgres` instance and connect its `DATABASE_URL` to the Rails web service.

Recommended deploy order:

1. create Postgres
2. set backend env vars
3. deploy the Rails web service
4. confirm `/up` and `/api/v1/health`

### 3. Deploy the Next.js app to Vercel

Import the same repository into Vercel and configure it as the frontend project.

Recommended settings:

- Framework preset: `Next.js`
- Root directory: `gift-tracker-web`
- Build command: `next build`

Required environment variable:

- `NEXT_PUBLIC_API_BASE_URL=https://<your-render-api-host>.onrender.com`

Recommended Node version:

- `22.x`

After deploy:

- open the Vercel URL
- create or log into an account
- confirm dashboard requests are reaching the deployed Rails API

## Reminder scheduling on hobby infrastructure

The Rails app already exposes the scheduler entrypoint:

```bash
cd gift-tracker-api
bin/rails reminders:run_daily
```

This task:

- queues reminders due for the target day
- processes queued reminder emails immediately

### Fully free option

If you want to stay completely free of cost, use the dashboard actions to queue and process reminders manually.

### Optional Render cron job

If you later choose to automate reminders on Render, create a cron job with:

```bash
bundle exec rails reminders:run_daily
```

Use the same environment variables as the Rails API service.

## First deploy checklist

- deploy the Rails API first
- verify `/up`
- verify `/api/v1/health`
- deploy the Vercel frontend
- set `NEXT_PUBLIC_API_BASE_URL`
- verify signup/login
- verify dashboard CRUD
- verify queue/process reminder actions manually

## Quickest path to live URLs

1. In Render, create the Postgres database first.
2. In Render, create the Rails web service from this repo or use the included blueprint.
3. Set `FRONTEND_APP_URL` temporarily to your future Vercel domain or update it once Vercel gives you the real URL.
4. Wait for the Rails deploy to finish and confirm:
   - `https://<your-render-api-host>.onrender.com/up`
   - `https://<your-render-api-host>.onrender.com/api/v1/health`
5. In Vercel, import the same repo with root directory `gift-tracker-web`.
6. Set `NEXT_PUBLIC_API_BASE_URL` to your Render API URL.
7. Redeploy Vercel if needed after setting the API URL.
8. Open the Vercel app and test signup, create a person, and create an occasion.

## Free-tier limitations

- Render free web services can cold start after inactivity
- Free Render Postgres is useful for testing, but it expires after 30 days
- Render cron jobs are not fully free; they have a minimum monthly charge
- `ActiveJob :async` is acceptable for hobby use but is not a durable background queue
- free SMTP/email providers usually have sender-verification and throughput limits
- Vercel Hobby is strong for the frontend, but backend uptime and reminder execution still depend on the Rails host

## Upgrade path later

When you move past the hobby setup, the cleanest upgrades are:

- paid Rails hosting on Render or another platform with stronger uptime guarantees
- durable background job infrastructure
- a long-lived Postgres plan
- automated reminder scheduling
- a dedicated transactional email provider with monitoring

## Why this structure

The web app is simple to host on Vercel, while the Rails API stays on a Rails-friendly platform with its own database, auth, and reminder delivery responsibilities.
