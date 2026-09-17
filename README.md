# Critol Finance

[English](#english) · [Español](#español)

## Español

Plataforma abierta de finanzas bursátiles para consultar cotizaciones, analizar mercados y seguir una cartera. La base incluye web SSR con Next.js, API REST/GraphQL y WebSockets, aplicación Expo y servicios locales de PostgreSQL y Redis.

### Inicio rápido

```bash
npm install
npm run dev       # http://localhost:3000
npm run dev:api   # http://localhost:4000
docker compose -f docker/docker-compose.yml up --build
```

La API ofrece `GET /health`, `GET /api/quotes`, `GET /api/quotes/:symbol`, autenticación JWT de demostración en `POST /api/auth/token` y GraphQL en `/graphql`. Configure secretos reales mediante variables de entorno (`JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`); nunca los confirme en Git.

### Planes

| Gratuito | Premium |
| --- | --- |
| Cotizaciones básicas y hasta 5 alertas | Análisis avanzado, alertas ilimitadas y sin publicidad |

El proyecto admite suscripciones, publicidad, API Premium y comisiones de brokers como integraciones de negocio futuras. Los datos incluidos son de demostración y no son asesoramiento financiero.

## English

An open stock-market finance platform for quotes, market analysis, and portfolio tracking. The starter includes a Next.js SSR web app, REST/GraphQL/WebSocket API, Expo application, and local PostgreSQL/Redis services.

### Quick start

```bash
npm install
npm run dev       # http://localhost:3000
npm run dev:api   # http://localhost:4000
docker compose -f docker/docker-compose.yml up --build
```

The API provides `GET /health`, `GET /api/quotes`, `GET /api/quotes/:symbol`, demo JWT authentication at `POST /api/auth/token`, and GraphQL at `/graphql`. Set real secrets using environment variables (`JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`); never commit them.

### Plans

| Free | Premium |
| --- | --- |
| Basic quotes and up to five alerts | Advanced analysis, unlimited alerts, and no ads |

Future revenue integrations can support subscriptions, advertising, Premium API access, and broker commissions. Included data is illustrative and is not financial advice.

## Architecture / Arquitectura

- `frontend/`: React 18, Next.js, Tailwind, Redux Toolkit, Recharts, bilingual UI and PWA manifest.
- `backend/`: Express REST API, Apollo GraphQL, Socket.IO realtime setup, JWT entry point.
- `mobile/`: Expo React Native starter.
- `docker/`: container definitions and Compose services.

## License / Licencia

Copyright 2026 castillolucho514-ux. All Rights Reserved.

This is proprietary, closed-source software. No use, copying, modification,
or distribution is permitted without prior written authorization from the
copyright owner. See the [LICENSE](LICENSE) file for details.

Este es un software propietario y de código cerrado. No se permite su uso,
copia, modificación ni distribución sin autorización previa por escrito del
titular del copyright. Consulta el archivo [LICENSE](LICENSE) para más
detalles.
