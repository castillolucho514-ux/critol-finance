# critol-finance
App de finanzas bursátiles bilingüe (ES/EN) colaborativa con análisis en tiempo real, cotizaciones, alertas inteligentes, modelo freemium y comunidad open-source bajo licencia MIT.

## CristoFinance — AI financial platform

Private, bilingual (ES/EN) AI financial assistant with Coinbase integration and Free/Pro/Premium plans.

```
frontend/   Next.js 14 + Tailwind + Recharts (login, dashboard, chat, settings, admin)
backend/    Express + TypeScript (JWT auth, plans, Stripe, Coinbase, LangChain chat engine)
database/   Prisma schema (schemas/) and SQL migrations (migrations/)
```

### Plans
| Plan | Features |
|---|---|
| Free | 10 chats/day, basic chat, watchlist, prices |
| Pro | Unlimited chat, trend/risk analysis, Coinbase portfolio, signals |
| Premium | Pro + order execution (explicit `confirm: true`) |

### Quick start (Docker)
```bash
cp .env.example .env   # set JWT_SECRET, POSTGRES_PASSWORD, API keys
docker compose up --build
```
Frontend: http://localhost:3000 · API: http://localhost:4000

### Local development
```bash
cd backend && npm install && npm run prisma:generate && npm run dev   # without DATABASE_URL uses in-memory store
cd frontend && npm install && npm run dev
cd backend && npm test
```

### Notes
- AI uses LangChain with OpenAI (`OPENAI_API_KEY`) or Gemini (`GEMINI_API_KEY`); without a key it returns market data only. Live prices and 30-day candles come from Coinbase public endpoints and feed the prompt (trend, volatility, rule-based signal).
- Coinbase balances/orders use server-side CDP API keys (single-owner/private deployment). Orders are capped at $10,000 and require explicit confirmation. Signals are informational, not financial advice.
- Make the first admin by setting `role = 'ADMIN'` in the `User` table.
- LlamaIndex and a Flowise/n8n workflow layer are not integrated yet.
