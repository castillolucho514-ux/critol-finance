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

### Android and iOS apps

The mobile apps package the frontend for Android and iOS; user accounts, market data, and chat still require the backend and PostgreSQL to be hosted online. Deploy the backend and database first, then deploy the frontend over HTTPS. Set `NEXT_PUBLIC_API_URL` to the public HTTPS API URL when building the mobile frontend, and configure the backend's `CORS_ORIGIN` for the deployed web frontend. Keep `JWT_SECRET`, database credentials, and any AI provider key on the backend only.

Build the frontend for native apps from `frontend`:

```sh
npm ci
CAPACITOR_BUILD=1 NEXT_PUBLIC_API_URL=https://api.example.com npm run build:mobile
npm run mobile:sync
```

On Windows PowerShell, set the variables before running the build:

```powershell
$env:CAPACITOR_BUILD = "1"
$env:NEXT_PUBLIC_API_URL = "https://api.example.com"
npm run build:mobile
npm run mobile:sync
```

For Android, install Android Studio and its Android SDK, then run `npm run mobile:open:android` and build a signed Android App Bundle (`.aab`) for Google Play. For iOS, use macOS with Xcode, run `npm run mobile:open:ios`, configure signing, and archive the app for App Store Connect. Publishing requires the corresponding Google Play Console or Apple Developer account. Before release, choose an app identifier you control, add final app icons and screenshots, and provide the privacy and financial-app disclosures required by each store.

### Security notes
- `JWT_SECRET` is required; the server refuses to start without it. No secrets are committed.
- Paid plan upgrades return 402 until a payment provider is integrated (`ALLOW_SELF_SERVICE_PLAN=true` is for development only).
- Set `ADMIN_EMAILS` to grant admin on registration; set `CORS_ORIGIN` in production.
- Chat output is educational, not financial advice.
