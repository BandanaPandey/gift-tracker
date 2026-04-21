# Gift Tracker

This repository is split into two apps so the frontend and backend can be deployed independently:

- `gift-tracker-web/` - Next.js web app
- `gift-tracker-api/` - Ruby on Rails API

The recommended free hobby setup is:

- `gift-tracker-web` on `Vercel Hobby`
- `gift-tracker-api` on `Render Web Service`
- `PostgreSQL` on `Render Postgres`
- reminder scheduling via a `Render cron job` that runs the existing Rails task

## Local setup

### API

```bash
cd gift-tracker-api
cp .env.example .env
bundle install
bin/rails db:prepare
bin/rails server -p 3001
```

To test reminder emails locally, keep `ACTION_MAILER_DELIVERY_METHOD=test` and use the dashboard to queue/process reminders.
For a real SMTP provider later, set `SMTP_ADDRESS`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `MAILER_FROM_EMAIL`.

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

## Hobby deployment guide

### 1. Deploy the Rails API to Render

Create a new `Web Service` in Render and point it to `gift-tracker-api`.

Suggested settings:

- Runtime: `Ruby`
- Root directory: `gift-tracker-api`
- Build command: `bundle install`
- Start command: `bundle exec rails server`

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

Recommended values in hobby deployment:

- `APP_PROTOCOL=https`
- `RAILS_LOG_LEVEL=info`
- `FRONTEND_APP_URL=https://<your-vercel-app>.vercel.app`
- `APP_HOST=<your-render-api-host>.onrender.com`

Notes:

- `FRONTEND_APP_URL` also drives CORS. You can provide multiple origins as a comma-separated list if needed.
- Render Postgres should provide the production `DATABASE_URL`.
- The API will fail fast on boot in production if required env vars are missing.

### 2. Create Render Postgres

Create a free `Render Postgres` instance and attach or copy its `DATABASE_URL` into the Rails web service.

Deploy order:

1. create Postgres
2. set backend env vars
3. deploy backend
4. confirm `/up` and `/api/v1/health` respond successfully

### 3. Deploy the Next.js app to Vercel

Import `gift-tracker-web` into Vercel.

Suggested settings:

- Framework preset: `Next.js`
- Root directory: `gift-tracker-web`
- Build command: `next build`
- Output setting: default Next.js output

Required environment variable:

- `NEXT_PUBLIC_API_BASE_URL=https://<your-render-api-host>.onrender.com`

After deployment:

- confirm login/signup works against the public API
- confirm the dashboard loads data from the deployed backend

### 4. Set up reminder scheduling

The Rails app already owns scheduling and delivery. Use the existing task:

```bash
cd gift-tracker-api
bin/rails reminders:run_daily
```

In Render, create a scheduled cron job using the same environment as the Rails API service and run:

```bash
bundle exec rails reminders:run_daily
```

This task:

- queues reminders due for the target day
- processes queued reminder emails immediately

### 5. First deploy checklist

- deploy the Rails API first
- verify `/up`
- verify `/api/v1/health`
- deploy the Vercel frontend with the public API URL
- verify auth flow from the browser
- verify dashboard CRUD calls work cross-origin
- verify one manual reminder queue/process cycle works
- then enable the scheduled reminder job

## Free-tier limitations

- Render free services can cold start after inactivity
- reminder cron reliability is fine for hobby use, but not guaranteed at production-grade precision
- `ActiveJob :async` is acceptable for hobby deployment but is not a durable queue
- SMTP/free email providers may impose low daily sending limits or stricter sender verification
- Vercel Hobby is great for the web UI, but the backend still determines API availability and reminder delivery reliability

## Upgrade path later

When you outgrow hobby hosting, the cleanest upgrades are:

- paid Render web service or Fly.io/Railway for a more reliable Rails backend
- durable background job infrastructure
- dedicated SMTP/email provider with better delivery monitoring
- optional additional frontend origins such as preview URLs or a custom domain

## Why this structure

This keeps the web app easy to host on Vercel while the Rails API runs on a Rails-friendly platform with its own database and scheduled jobs.
