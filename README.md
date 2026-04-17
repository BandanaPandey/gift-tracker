# Gift Tracker

This repository is set up as two separate apps so the web app and API can be deployed independently:

- `gift-tracker-web/` - Next.js web app
- `gift-tracker-api/` - Ruby on Rails API

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

### Web App

```bash
cd gift-tracker-web
cp .env.example .env.local
npm install
npm run dev
```

## Current API contract

- Rails app health check: `GET /up`
- Versioned API health check: `GET /api/v1/health`

## Reminder operations

The Rails app owns all reminder scheduling and delivery. For deploys where the web app and API run separately, trigger the daily reminder cycle on the API side with:

```bash
cd gift-tracker-api
bin/rails reminders:run_daily
```

That task will:
- queue reminders due for the target day
- process queued reminder emails immediately

For hosted deployments, run that command from a cron job, platform scheduler, or worker process.

## Why this structure

This keeps the web app free to deploy on platforms like Vercel, while the Rails API can run on Render, Fly.io, or another Rails-friendly host with its own database and worker processes.
