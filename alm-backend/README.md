# Automated Logistics Module (ALM) Backend Service

This backend service implements the server-side components of the Automated Logistics Module (ALM), connecting Mapbox route optimization, traffic-aware predictive ETAs, electronic proof of delivery (ePOD), and offline status synchronization into a unified logistics workflow.

---

## 1. Architecture

```text
alm-backend/
├── src/
│   ├── config/              # Environment, Mapbox, OpenAI Vision, S3 storage clients
│   ├── middleware/          # JWT Auth, RBAC Authorization, Rate Limiting, Error Handling
│   ├── modules/
│   │   ├── routing/         # Mapbox Optimization API integration, stop order confirmation
│   │   ├── eta/             # Traffic-weighted predictive ETA calculations
│   │   ├── deliveries/      # Delivery status management and idempotency checks
│   │   ├── epod/            # Secure document uploads, OpenAI GPT-4o Vision audits
│   │   └── sync/            # Batch synchronization for offline IndexedDB mutations
│   │   └── tracking/        # GPS persistence, scoped public links, SSE and Socket.IO updates
│   ├── routes/              # Express API route mapping
│   ├── app.js               # Express application configuration
│   └── server.js            # HTTP and Socket.IO server entrypoint
├── tests/                   # Automated unit & integration tests
├── .env.example             # Configuration variables template
└── package.json
```

---

## 2. API Endpoints

All endpoints are mounted under the `/api/v1` namespace:

| Method | Endpoint | Description | Required Role |
|---|---|---|---|
| `GET` | `/api/v1/alm/health` | Health check & uptime | Public |
| `POST` | `/api/v1/routes/optimize` | Mapbox route sequence optimization | Dispatcher, Operations Manager, Administrator |
| `POST` | `/api/v1/routes/:routeId/confirm` | Confirm & dispatch proposed route | Dispatcher, Operations Manager, Administrator |
| `GET` | `/api/v1/routes/:routeId` | Fetch confirmed route and stops | Authenticated Users |
| `POST` | `/api/v1/eta/predict` | Calculate traffic-aware arrival time | Authenticated Users |
| `POST` | `/api/v1/deliveries/:deliveryId/epod` | Upload proof of delivery document | Driver, Administrator, Fleet Manager |
| `GET` | `/api/v1/deliveries/:deliveryId/epod` | Query ePOD audit metadata | Auditor, Operations Manager, Administrator, Driver |
| `GET` | `/api/v1/epod/:epodId/download-url` | Generate short-lived presigned URL | Auditor, Operations Manager, Administrator |
| `PATCH` | `/api/v1/deliveries/:deliveryId/status` | Update delivery status (idempotent) | Authenticated Users |
| `POST` | `/api/v1/deliveries/sync` | Batch sync offline delivery mutations | Authenticated Users |
| `GET` | `/api/v1/invoices/email-ready` | List finalized invoices available for email | Operations Manager, Administrator |
| `POST` | `/api/v1/invoices/:id/send` | Email a finalized invoice | Operations Manager, Administrator |
| `POST` | `/api/v1/emails/:id/retry` | Retry a failed invoice email | Operations Manager, Administrator |
| `POST` | `/api/v1/webhooks/resend` | Receive signed Resend delivery events | Resend signature |
| `POST` | `/api/v1/tracking/:jobId/points` | Store an assigned driver's location batch | Driver |
| `GET` | `/api/v1/tracking/active` | Latest locations for assigned active jobs | Dispatcher, Operations Manager, Administrator |
| `GET` | `/api/v1/tracking/:jobId/history` | Retained location history | Dispatcher, Operations Manager, Administrator |
| `POST` | `/api/v1/tracking/:jobId/public-token` | Create a job-scoped customer link | Dispatcher, Operations Manager, Administrator |
| `GET` | `/api/v1/tracking/public/:token` | Read a limited public tracking snapshot | Public token |
| `GET` | `/api/v1/tracking/stream` | Authenticated dispatcher SSE stream | Dispatcher, Operations Manager, Administrator |
| `GET` | `/api/v1/tracking/public/:token/stream` | Job-scoped public SSE stream | Public token |

---

## 3. Setup and Running

```bash
cd alm-backend
npm install
npm run db:generate
npm run db:deploy
npm start
```

Runs on port `5000` by default.

Tracking persists points and customer-token hashes in PostgreSQL. Apply the migration with `npm run db:deploy`; the server runs a cleanup at startup and once per day to remove location points older than 30 days.

This repository does not contain production identity or job-assignment providers. Tracking endpoints fail closed in production until `TRACKING_INTEGRATION_MODULE` points to a deployment-owned module exporting `configure({ configureTrackingIntegration, prisma })`. That module must register both a real HTTP/Socket.IO authentication adapter and tenant-scoped job-assignment methods. Do not use the development mock identity as production authentication. The integration contract is documented in [../docs/tracking-api.md](../docs/tracking-api.md).

Tracking-specific defaults are `TRACKING_RETENTION_DAYS=30`, `TRACKING_PUBLIC_DELIVERY_GRACE_HOURS=2`, `TRACKING_DRIVER_RATE_LIMIT_PER_MINUTE=120`, and `TRACKING_PUBLIC_RATE_LIMIT_PER_MINUTE=60`. The frontend tracking map and transport use OpenStreetMap and the same-origin/backend URLs in the Angular environment; neither requires a paid key.

Invoice email delivery uses the server-only environment variables `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `MAIL_FROM_ADDRESS`, `EMAIL_DAILY_CAP_PER_TENANT` and `APP_NAME`. Configure the Resend webhook URL as `/api/v1/webhooks/resend` and preserve the raw request body so its signature can be verified.

Invoice email routes require an authenticated Administrator or Operations Manager and are scoped to the authenticated tenant. The UI lists only finalized `OPEN` or `PAID` records with invoice numbers; browser-local drafts cannot be sent. Email recipients are read from the tenant-scoped customer record. The current mailer attaches stored `Invoice.pdfBytes` when present; until PDF storage is wired, it attaches a valid placeholder PDF marked with a TODO in the service code.
