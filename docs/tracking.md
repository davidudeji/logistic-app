# Live tracking

## Architecture

- The driver page watches GPS only while open, filters low-accuracy fixes, and stores offline points in IndexedDB for ordered batch upload.
- The backend validates and persists points in PostgreSQL `location_points`, then publishes accepted positions to authenticated Socket.IO subscribers and SSE clients.
- The dispatcher page polls the active-job list every 30 seconds and consumes job-scoped Socket.IO updates. Positions become stale after two minutes. Completed trip history is read from the protected history endpoint.
- Customer links use a random 256-bit URL-safe token. Only its SHA-256 hash is stored. The public page polls the token-scoped snapshot every 15 seconds and never requests history.

The browser transport uses the free OpenStreetMap tile URL in `src/environments/environment.ts`. Preserve the configured attribution and follow the tile provider's usage policy. To use another tile service, change `trackingMap.tileUrl`, `trackingMap.attribution`, and `trackingMap.maxZoom`; no tracking logic depends on a paid map SDK or key.

## Deployment integration

The repository has no production identity provider or source of job/driver/vehicle assignments. Tracking therefore returns `503` in production until both integrations are registered. `TRACKING_INTEGRATION_MODULE` names a deployment-owned JavaScript module (resolved from the backend process working directory) that exports:

```js
export async function configure({ configureTrackingIntegration, prisma }) {
  configureTrackingIntegration({
    authentication: {
      authenticateRequest(req, res, next) { /* verify bearer identity */ },
      async authenticateToken(token) { /* verify Socket.IO identity */ },
    },
    assignments: {
      async getDriverAssignment(jobId, user) { /* tenant-scoped assignment */ },
      async getDispatcherJob(jobId, user) { /* authorize dispatcher access */ },
      async listActiveJobs(user) { /* jobs visible to this dispatcher */ },
      async getPublicJob(jobId, tenantId) { /* narrow customer-safe fields */ },
    },
  });
}
```

Authentication must return a trusted principal with `id`, `role`, and `tenantId`. Assignment methods must enforce the current tenant and job permissions, and return the normalized fields described in [tracking-api.md](./tracking-api.md). Do not use the development mock identity or a client-supplied job/vehicle/driver ID as a production authorization source. Without a configured module, authenticated tracking requests return `503`; public lookups also fail closed because a token cannot be resolved safely without the assignment source.

Set `TRACKING_RETENTION_DAYS` to `30` for the specified retention policy. The backend performs cleanup at startup and every 24 hours. Uploads and reads also enforce the retention cutoff. Public links expire two hours after the assignment provider's delivery timestamp by default; active-job tokens have no delivery expiry until that status transition is reported.

## Mobile/background limitation

Web browsers cannot reliably track location in the background with the screen off. The driver experience asks the user to keep the screen open while delivering. A later upgrade could use Capacitor plus a background-geolocation plugin; native background tracking is not implemented.

## Verification

Run the frontend suite and production build from the repository root, and the backend suite plus Prisma validation from `alm-backend/`:

```bash
npx ng test --watch=false
npx ng build --configuration production
cd alm-backend
npm test
DATABASE_URL=postgresql://localhost:5432/alm_logistics npx prisma validate
```
