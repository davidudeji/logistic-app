# Automated Logistics Module (ALM) Backend Service

This backend service implements the server-side components of the Automated Logistics Module (ALM), connecting fleet telemetry, Mapbox route optimization, traffic-aware predictive ETAs, electronic proof of delivery (ePOD), and offline status synchronization into a unified logistics workflow.

---

## 1. Architecture

```text
alm-backend/
├── src/
│   ├── config/              # Environment, Mapbox, OpenAI Vision, S3 storage clients
│   ├── middleware/          # JWT Auth, RBAC Authorization, Rate Limiting, Error Handling
│   ├── modules/
│   │   ├── telemetry/       # Vehicle GPS validation, telemetry store, Socket.IO broadcast
│   │   ├── routing/         # Mapbox Optimization API integration, stop order confirmation
│   │   ├── eta/             # Traffic-weighted predictive ETA calculations
│   │   ├── deliveries/      # Delivery status management and idempotency checks
│   │   ├── epod/            # Secure document uploads, OpenAI GPT-4o Vision audits
│   │   └── sync/            # Batch synchronization for offline IndexedDB mutations
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
| `GET` | `/api/v1/fleet/telemetry` | Current active vehicle positions | Fleet Manager, Dispatcher, Operations Manager, Administrator |
| `GET` | `/api/v1/fleet/:assetId/telemetry` | Vehicle location history | Fleet Manager, Dispatcher, Operations Manager, Administrator |
| `POST` | `/api/v1/routes/optimize` | Mapbox route sequence optimization | Dispatcher, Operations Manager, Administrator |
| `POST` | `/api/v1/routes/:routeId/confirm` | Confirm & dispatch proposed route | Dispatcher, Operations Manager, Administrator |
| `GET` | `/api/v1/routes/:routeId` | Fetch confirmed route and stops | Authenticated Users |
| `POST` | `/api/v1/eta/predict` | Calculate traffic-aware arrival time | Authenticated Users |
| `POST` | `/api/v1/deliveries/:deliveryId/epod` | Upload proof of delivery document | Driver, Administrator, Fleet Manager |
| `GET` | `/api/v1/deliveries/:deliveryId/epod` | Query ePOD audit metadata | Auditor, Operations Manager, Administrator, Driver |
| `GET` | `/api/v1/epod/:epodId/download-url` | Generate short-lived presigned URL | Auditor, Operations Manager, Administrator |
| `PATCH` | `/api/v1/deliveries/:deliveryId/status` | Update delivery status (idempotent) | Authenticated Users |
| `POST` | `/api/v1/deliveries/sync` | Batch sync offline delivery mutations | Authenticated Users |

---

## 3. Real-Time Socket.IO Events

### Client -> Server
- `join_room` (`{ room: string }`): Join specific asset room or fleet monitoring.
- `leave_room` (`{ room: string }`): Leave room.
- `driver_location_broadcast`: Driver reports vehicle GPS coordinates.
  ```typescript
  {
    assetId: string;
    longitude: number;
    latitude: number;
    telemetryTimestamp: string;
    heading?: number;
    speedKph?: number;
    accuracyMeters?: number;
  }
  ```

### Server -> Monitoring Clients
- `fleet_telemetry_ping`: Broadcast to authorized monitoring clients.
  ```typescript
  {
    eventId: string;
    assetId: string;
    longitude: number;
    latitude: number;
    telemetryTimestamp: string;
    receivedAt: string;
    heading?: number;
    speedKph?: number;
  }
  ```

---

## 4. Setup and Running

```bash
cd alm-backend
npm install
npm start
```

Runs on port `5000` by default.
