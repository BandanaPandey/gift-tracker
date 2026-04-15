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

## Why this structure

This keeps the web app free to deploy on platforms like Vercel, while the Rails API can run on Render, Fly.io, or another Rails-friendly host with its own database and worker processes.
