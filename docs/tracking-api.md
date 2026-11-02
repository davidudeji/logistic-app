# Tracking API contract

All HTTP paths below are relative to `/api/v1`. Tracking storage is PostgreSQL-backed. Job/driver identity and assignment are supplied by the deployment integration described in [tracking.md](./tracking.md); this service does not invent job records or accept client-selected vehicle assignments.

## Authentication and authorization

- `POST /tracking/:jobId/points`: authenticated `Driver`; the assignment provider must confirm that this identity is assigned to the requested job and tenant. The server obtains the vehicle ID from that assignment.
- `GET /tracking/active`, `GET /tracking/:jobId/history`, and `POST /tracking/:jobId/public-token`: authenticated `Dispatcher`, `Operations Manager`, or `Administrator`; the assignment provider must scope every lookup to the caller's tenant and permissions.
- `GET /tracking/stream`: the same dispatcher roles; each streamed job is rechecked against the assignment provider.
- `/tracking/public/:token` and its stream are unauthenticated, read-only, scoped to one random token, and return no job ID, driver ID, history, or other job data.
- Production HTTP and Socket.IO tracking authentication return `503 TRACKING_AUTH_PROVIDER_NOT_CONFIGURED` until a real authentication adapter is registered. Missing assignment integration returns `503 TRACKING_ASSIGNMENT_PROVIDER_NOT_CONFIGURED`.

The assignment provider returns normalized lowercase statuses: `assigned`, `in_transit`, `arrived`, or `delivered`. Its driver-job result includes `tenantId`, `jobId`, `driverId`, `vehicleId`, and status. Dispatcher/public job results additionally include the vehicle registration, driver's first name, and (for the public snapshot only) a callable phone number. A delivered job must include `deliveredAt`.

## Endpoints

### `POST /tracking/:jobId/points`

Body:

```json
{
  "points": [
    {
      "jobId": "JOB-001",
      "lat": 6.5244,
      "lng": 3.3792,
      "accuracy": 12,
      "speed": 18,
      "heading": 90,
      "timestamp": "2026-11-02T10:15:30.000Z"
    }
  ]
}
```

`points` contains 1–100 items. Coordinates, accuracy, optional speed/heading, timestamp, job scope, 30-day age, and five-minute future skew are validated. A successful request returns `202 {"accepted": n}`. Per-driver requests are limited to 120/minute by default.

### `GET /tracking/active`

Returns the caller-visible active jobs, each with `jobId`, `vehicleId`, `vehicleRegistration`, `driverFirstName`, normalized `status`, and `latestPosition` (a tracking point or `null`). Results are scoped through the provider and tenant.

### `GET /tracking/:jobId/history?limit=5000`

Returns chronological tracking points for an authorized job. `limit` is optional, defaults to 5000, and is bounded to 1–5000. Retained history is limited to the configured retention window.

### `POST /tracking/:jobId/public-token`

Dispatcher-only. Issues 32 cryptographically random bytes encoded as a 43-character base64url token. The plaintext token is returned once and never stored; the database stores its SHA-256 hash. Returns `201 {"token":"…","expiresAt":null}` while the job is active. For an already delivered job, `expiresAt` is its delivery timestamp plus the configured grace window (two hours by default).

### `GET /tracking/public/:token`

No authentication. Returns only:

```json
{
  "driverFirstName": "Ada",
  "driverPhone": "+234 800 000 0000",
  "vehicleRegistration": "ABC-123",
  "status": "in_transit",
  "position": { "lat": 6.5244, "lng": 3.3792 },
  "lastUpdatedAt": "2026-11-02T10:15:30.000Z",
  "eta": null
}
```

`position` and `lastUpdatedAt` may be `null` before the first GPS point. ETA remains `null`; ETA prediction is out of scope. Invalid and unknown tokens return `404`; expired tokens return `410`. Public requests are limited to 60/minute per token by default. The `driverPhone` is provided only for the “Call driver” action; no other driver details are returned.

### Streams

- `GET /tracking/stream`: authenticated SSE; emits `ready` then authorized `position` events containing a tracking point. Access is checked for each job update.
- `GET /tracking/public/:token/stream`: public SSE; emits only the same safe `snapshot` shape, then `expired` when the token expires. It never streams history.
- Socket.IO uses the backend origin. Clients authenticate in the handshake with the bearer token, then emit `tracking:subscribe` / `tracking:unsubscribe` with `{ "jobId": "…" }`. `tracking:position` contains an authorized tracking point; `tracking:error` identifies the affected job and failure.

## Persistence and retention

`location_points` stores `job_id`, `vehicle_id`, `tenant_id`, `lat`, `lng`, `accuracy`, nullable `speed`/`heading`, `recorded_at`, and `created_at`. It has an index on `(job_id, recorded_at)` plus tenant/job and vehicle indexes. `public_tracking_tokens` stores only the token hash, tenant/job scope, creation/expiry, and optional revocation time. A daily backend job removes points older than 30 days; reads enforce the same cutoff.

The in-process rate limits are suitable for a single backend instance. Multi-instance deployments should replace or front them with a shared rate-limit store while preserving per-driver and per-token keys.
