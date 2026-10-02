# critol-finance
App de finanzas bursátiles bilingüe (ES/EN) colaborativa con análisis en tiempo real, cotizaciones, alertas inteligentes, modelo freemium y comunidad open-source bajo licencia MIT.

## CristoFinance – setup

Stack: Express + TypeScript + Prisma/PostgreSQL (backend), Next.js (frontend), Docker.

Features: JWT auth, subscription plans (FREE/PRO/PREMIUM with daily chat limits), AI chat (OpenAI), Coinbase spot prices, admin endpoints, dashboard/chat/settings/subscription UI.

### Run with Docker
```
cp .env.example .env     # set JWT_SECRET (openssl rand -hex 32), POSTGRES_PASSWORD, etc.
docker compose --env-file .env -f docker/docker-compose.yml up --build
```
Frontend: http://localhost:3000 · API: http://localhost:4000. Migrations run on backend start.

### Local development
```
cd backend && npm ci && npx prisma generate && npm test && npm run dev
cd frontend && npm ci && npm run dev
```

### Security notes
- `JWT_SECRET` is required; the server refuses to start without it. No secrets are committed.
- Paid plan upgrades return 402 until a payment provider is integrated (`ALLOW_SELF_SERVICE_PLAN=true` is for development only).
- Set `ADMIN_EMAILS` to grant admin on registration; set `CORS_ORIGIN` in production.
- Chat output is educational, not financial advice.
