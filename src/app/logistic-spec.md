# AUTOMATED LOGISTICS MODULE (ALM)
## Technical Architecture & Implementation Specification

**Project:** Logistics Management Application  
**Module:** Automated Logistics Module (ALM)  
**Frontend:** Angular 19, TypeScript  
**Backend:** Node.js 20+, Express.js, TypeScript-compatible ES Modules  
**Real-Time Communication:** Socket.IO  
**Mapping:** Mapbox GL JS and Mapbox APIs  
**AI Integration:** OpenAI GPT-4o Vision  
**Media Storage:** AWS S3  
**Offline Persistence:** IndexedDB and Angular service worker integration  
**Document Status:** Implementation Specification

---

# 1. PROJECT OBJECTIVE

Implement an Automated Logistics Module within the existing Angular 19 logistics management application.

The module will connect fleet telemetry, route optimization, predictive estimated arrival times, electronic proof of delivery, document auditing, and offline delivery updates into a unified logistics workflow.

ALM must integrate with the existing application without breaking current features, routes, services, models, authentication, or UI components.

The implementation must prioritize:

- Modular architecture and separation of concerns.
- Reliable communication between Angular and Node.js.
- Real-time fleet visibility.
- Route optimization using Mapbox.
- Traffic-aware ETA estimation.
- AI-assisted proof-of-delivery auditing.
- Offline delivery-status updates with synchronization.
- Secure handling of driver locations and delivery documents.
- Accessibility, responsiveness, and maintainability.
- Production-oriented error handling, logging, and validation.

## 1.1 Primary User Roles

Support the existing application's authorization model. Map the following capabilities to actual roles already defined in the project rather than introducing duplicate role definitions.

| Role | ALM capabilities |
|---|---|
| Fleet Manager | Monitor vehicles, review routes, track ETAs, investigate alerts |
| Dispatcher | Assign drivers, optimize routes, monitor dispatch progress |
| Driver | Share location, view assigned stops, submit delivery status and proof of delivery |
| Operations Manager | Monitor delivery performance, exceptions, and fleet utilization |
| Administrator | Configure integrations, manage permissions, inspect system health |
| Auditor | Review proof-of-delivery documents and AI-generated audit findings |

Access to individual capabilities must be controlled by backend authorization, not merely by hiding frontend buttons.

---

# 2. EXISTING APPLICATION INTEGRATION

Before writing code, inspect the current repository.

Do not create a separate replacement logistics application.

Preserve and extend the existing implementation.

## 2.1 Repository Discovery

Inspect:

1. `package.json` and the Angular 19 version.
2. Angular application configuration and build setup.
3. Existing routing and lazy-loaded feature modules.
4. Existing authentication and authorization services.
5. Existing HTTP interceptors.
6. Existing state-management approach.
7. Existing fleet, driver, dispatch, and delivery models.
8. Existing `FleetService`, `DispatchJob`, and related services, if present.
9. Existing `MapComponent`, `DispatchTableComponent`, and sidebar components, if present.
10. Existing map implementation and provider.
11. Existing API endpoints and backend architecture.
12. Existing environment configuration.
13. Existing testing tools and conventions.
14. Existing shared UI components and design system.

Determine whether the backend already exists.

If it does, extend it according to its conventions. If no backend exists, implement ALM as a separate Node.js service that integrates through HTTP APIs and Socket.IO.

Do not duplicate existing functionality without a documented reason.

## 2.2 Compatibility Requirements

The Angular application must remain on Angular 19.

Use:

- Standalone Angular components.
- Angular dependency injection.
- Angular signals where they fit the existing state-management approach.
- RxJS for asynchronous streams and event-driven workflows.
- Typed reactive forms where forms are required.
- Angular `HttpClient` for HTTP communication.
- Angular Router for navigation.
- Angular's existing authentication and authorization patterns.

Do not upgrade the Angular application simply to implement ALM.

Do not introduce a second state-management library if the application already uses a suitable established solution.

---

# 3. TARGET SYSTEM ARCHITECTURE

Implement ALM using a layered architecture.

## 3.1 High-Level Data Flow

```text
                    ANGULAR 19 APPLICATION
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Fleet Dashboard       Dispatch Board       Delivery Detail │
│       │                     │                      │        │
│       └─────────────────────┼──────────────────────┘        │
│                             │                               │
│                 ALM Angular Feature Layer                   │
│                             │                               │
│        ┌────────────────────┼───────────────────┐           │
│        │                    │                   │           │
│   Fleet Service       Routing Service      ePOD Service     │
│        │                    │                   │           │
│        └────────────────────┼───────────────────┘           │
│                             │                               │
│                 Angular HTTP / Socket.IO                    │
└─────────────────────────────┼───────────────────────────────┘
                              │
                       ALM Backend API
                              │
┌─────────────────────────────┼───────────────────────────────┐
│                    Node.js / Express                        │
│                                                             │
│  Authentication / Authorization / Validation / Rate Limits  │
│                             │                               │
│  ┌───────────────┬──────────┼──────────┬──────────────┐      │
│  │               │          │          │              │      │
│ Fleet Telemetry  Routing   Delivery   ePOD Audit    Sync     │
│  │               │          │          │              │      │
│  └───────────────┴──────────┼──────────┴──────────────┘      │
│                             │                               │
│       ┌─────────────────────┼────────────────────┐          │
│       │                     │                    │          │
│     Mapbox               OpenAI                 AWS S3       │
│       │                     │                    │          │
│       └─────────────────────┼────────────────────┘          │
│                             │                               │
│                     Application Database                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

The database must be the authoritative source for persisted fleet, route, delivery, and audit records.

Socket.IO is used for timely updates, not as a replacement for database persistence.

## 3.2 Architectural Rules

1. Angular components must not call Mapbox Optimization or OpenAI directly for privileged operations.
2. All secret API keys must remain on the server.
3. The browser may use a restricted public Mapbox token for map rendering if required.
4. Route optimization and ETA calculations must run through backend services.
5. Delivery records must be persisted before a successful response is returned.
6. Socket.IO events must be emitted only after the relevant data has passed authorization and validation.
7. The Angular frontend must consume typed API contracts.
8. The ALM backend must not depend on Angular components or browser-specific APIs.
9. Offline queues must be implemented in the browser and synchronized through authenticated backend endpoints.
10. Existing application APIs must remain compatible unless a documented migration is approved.

---

# 4. REQUIRED PROJECT STRUCTURE

Adapt these paths to the repository's current organization. Do not move unrelated files merely to match this example.

## 4.1 Angular Frontend

Recommended feature structure:

```text
src/app/
├── core/
│   ├── auth/
│   ├── interceptors/
│   └── realtime/
│       └── socket-connection.service.ts
│
├── features/
│   └── alm/
│       ├── models/
│       │   ├── fleet-telemetry.model.ts
│       │   ├── optimized-route.model.ts
│       │   ├── predictive-eta.model.ts
│       │   ├── delivery.model.ts
│       │   └── epod-audit.model.ts
│       │
│       ├── services/
│       │   ├── fleet-telemetry.service.ts
│       │   ├── route-optimization.service.ts
│       │   ├── predictive-eta.service.ts
│       │   ├── epod.service.ts
│       │   ├── delivery-status.service.ts
│       │   └── offline-sync.service.ts
│       │
│       ├── data-access/
│       │   ├── alm-api.service.ts
│       │   └── alm-error-handler.service.ts
│       │
│       ├── components/
│       │   ├── fleet-live-map/
│       │   ├── fleet-telemetry-panel/
│       │   ├── route-optimization-panel/
│       │   ├── predictive-eta-card/
│       │   ├── delivery-timeline/
│       │   ├── epod-upload/
│       │   ├── epod-audit-panel/
│       │   └── offline-sync-indicator/
│       │
│       ├── pages/
│       │   ├── fleet-monitoring-page/
│       │   ├── route-planning-page/
│       │   └── delivery-detail-page/
│       │
│       └── alm.routes.ts
│
└── app.routes.ts
```

Use the application's existing shared components and models where suitable.

## 4.2 Node.js Backend

If ALM requires a new backend service, use the following organization:

```text
alm-backend/
├── src/
│   ├── config/
│   │   ├── env.js
│   │   ├── mapbox.js
│   │   ├── openai.js
│   │   └── s3.js
│   │
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   ├── error-handler.js
│   │   ├── rate-limit.js
│   │   └── validate-request.js
│   │
│   ├── modules/
│   │   ├── telemetry/
│   │   │   ├── telemetry.controller.js
│   │   │   ├── telemetry.service.js
│   │   │   ├── telemetry.repository.js
│   │   │   └── telemetry.socket.js
│   │   │
│   │   ├── routing/
│   │   │   ├── routing.controller.js
│   │   │   ├── routing.service.js
│   │   │   └── routing.validation.js
│   │   │
│   │   ├── eta/
│   │   │   ├── eta.controller.js
│   │   │   └── eta.service.js
│   │   │
│   │   ├── deliveries/
│   │   │   ├── delivery.controller.js
│   │   │   ├── delivery.service.js
│   │   │   └── delivery.repository.js
│   │   │
│   │   ├── epod/
│   │   │   ├── epod.controller.js
│   │   │   ├── epod.service.js
│   │   │   └── epod.validation.js
│   │   │
│   │   └── sync/
│   │       ├── sync.controller.js
│   │       └── sync.service.js
│   │
│   ├── routes/
│   │   └── index.js
│   ├── app.js
│   └── server.js
│
├── tests/
├── package.json
├── .env.example
└── README.md
```

The previously generated ALM files may serve as initial implementation references, but they must be adapted into this structure rather than copied blindly.

---

# 5. FEATURE A: REAL-TIME FLEET TELEMETRY

## 5.1 Objective

Display current vehicle locations and operational telemetry in the existing fleet dashboard.

Location data must flow from authenticated driver devices to the backend and then to authorized monitoring clients.

## 5.2 Driver Location Payload

Define the shared event contract:

```typescript
export interface DriverLocationBroadcast {
  assetId: string;
  longitude: number;
  latitude: number;
  telemetryTimestamp: string;
  heading?: number;
  speedKph?: number;
  accuracyMeters?: number;
}
```

Coordinates must use longitude first and latitude second.

The backend must validate:

- Asset ID exists and is associated with the authenticated driver.
- Longitude is between -180 and 180.
- Latitude is between -90 and 90.
- Timestamp is valid.
- Coordinates are not unreasonably far in the future.
- Speed and heading are within valid ranges when provided.
- The event is not an unauthorized replay of an older location.
- The device is authorized to report the specified vehicle.

Apply an appropriate policy for stale events and temporary GPS drift.

## 5.3 Socket.IO Events

### Client to server

`driver_location_broadcast`

Used by authorized driver clients to report location.

### Server to authorized monitoring clients

`fleet_telemetry_ping`

Payload:

```typescript
export interface FleetTelemetryPing {
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

### Connection management

The Angular client must:

- Establish a connection after authentication.
- Join only authorized fleet or asset monitoring rooms.
- Reconnect after temporary connectivity loss.
- Clean up subscriptions when services or components are destroyed.
- Avoid creating duplicate socket connections.
- Recover the latest fleet snapshot after reconnection.
- Ignore stale telemetry updates.

The backend must authorize room membership and avoid broadcasting private fleet information to unrelated tenants or customers.

## 5.4 Angular Integration

Implement `SocketConnectionService` as the centralized Socket.IO connection manager.

Implement `FleetTelemetryService` to:

1. Subscribe to `fleet_telemetry_ping`.
2. Validate incoming payloads at runtime.
3. Maintain current vehicle positions.
4. Expose updates as observables or Angular signals.
5. Remove or mark stale vehicles according to configured thresholds.
6. Request a fresh fleet snapshot after reconnection.

Do not open a new Socket.IO connection every time the user navigates to the fleet map.

## 5.5 Map Integration

Extend the existing map component if possible.

Vehicle markers should display:

- Vehicle or asset identifier.
- Current location.
- Driver name, where authorized.
- Speed and heading, where available.
- Last telemetry time.
- Operational status.
- Assigned route or delivery, where applicable.

Use Mapbox GL JS with an appropriate map style.

Update existing markers or map sources rather than destroying and recreating the entire map for every location event.

Handle component destruction, map initialization failures, and missing tokens.

---

# 6. FEATURE B: ROUTE OPTIMIZATION

## 6.1 Objective

Enable dispatchers to optimize delivery stop sequences using the Mapbox Optimization API.

The feature must integrate with existing dispatch jobs, assigned drivers, and vehicle assignments.

## 6.2 Workflow

1. Dispatcher selects a vehicle or driver.
2. Dispatcher selects or confirms delivery stops.
3. Frontend sends the selected stops to the backend.
4. Backend verifies that the dispatcher may access those jobs.
5. Backend validates coordinates and route constraints.
6. Backend requests an optimized sequence from Mapbox.
7. Backend maps the response to the original delivery IDs.
8. Frontend displays the optimized order and route.
9. Dispatcher reviews and explicitly confirms the proposed sequence.
10. Backend persists the approved route and its stop ordering.
11. Relevant dispatch views receive an authorized update.

Optimization must not silently change an already dispatched route without an explicit business rule permitting it.

## 6.3 Request Contract

`POST /api/v1/routes/optimize`

Request:

```typescript
export interface OptimizeRouteRequest {
  assetId: string;
  deliveryIds: string[];
  origin: [number, number];
  destination?: [number, number];
  departureAt?: string;
}
```

Coordinates are represented as `[longitude, latitude]`.

The backend must retrieve authoritative delivery locations using `deliveryIds`. It must not trust client-supplied delivery addresses or identifiers without authorization checks.

## 6.4 Response Contract

```typescript
export interface OptimizedRouteResponse {
  optimizationId: string;
  assetId: string;
  orderedDeliveryIds: string[];
  totalDistanceMeters: number;
  estimatedDurationSeconds: number;
  geometry?: GeoJSON.LineString;
  provider: 'mapbox';
  generatedAt: string;
}
```

Preserve the mapping between optimized waypoints and original delivery IDs.

Mapbox waypoint indices must not be confused with delivery database IDs.

## 6.5 Route Constraints

Handle:

- Fixed starting points.
- Optional fixed destinations.
- Maximum supported waypoint counts.
- Duplicate coordinates.
- Invalid or missing addresses.
- Stops without valid geocoded locations.
- Routes that cannot be optimized.
- API timeouts and rate limits.
- Existing driver assignments.
- Delivery time windows, if supported by the business.
- Vehicle capacity and cargo constraints, if supported.

Do not claim that ordinary waypoint optimization solves multi-vehicle capacity planning, pickup-and-delivery constraints, or complex vehicle routing problems.

If the requirements expand to those problems, define a separate vehicle-routing optimization capability.

---

# 7. FEATURE C: PREDICTIVE ETA

## 7.1 Objective

Provide traffic-aware arrival estimates for vehicles and delivery stops.

The initial implementation uses Mapbox traffic-aware route durations and a configurable adjustment factor.

Do not describe this initial calculation as a trained AI prediction model.

## 7.2 Request

`POST /api/v1/eta/predict`

```typescript
export interface PredictEtaRequest {
  assetId: string;
  deliveryId: string;
  origin: [number, number];
  destination: [number, number];
  trafficWeight?: number;
}
```

The backend must authorize the vehicle and delivery and derive coordinates from trusted records wherever possible.

## 7.3 Response

```typescript
export interface PredictEtaResponse {
  assetId: string;
  deliveryId: string;
  baselineDurationSeconds: number;
  predictedDurationSeconds: number;
  distanceMeters: number;
  trafficWeight: number;
  departureTimestamp: string;
  predictedArrivalTimestamp: string;
  method: string;
}
```

## 7.4 Calculation

The initial calculation is:

`predictedDuration = baselineDuration × trafficWeight`

The traffic weight must be bounded by server configuration.

The frontend should display:

- Estimated arrival time.
- Remaining travel duration.
- Remaining distance.
- Last recalculation time.
- ETA confidence or reliability status, only if a defensible measure exists.

Do not label the estimate as highly accurate without measured evidence.

## 7.5 Recalculation Strategy

Avoid calling the Directions API for every GPS event.

Recalculate when:

- The vehicle has materially deviated from the assigned route.
- The vehicle has moved into a different route segment.
- Traffic conditions justify an update.
- The dispatcher requests a refresh.
- The previous ETA has become stale.

Use caching, request coalescing, rate limits, and configurable update intervals.

---

# 8. FEATURE D: ELECTRONIC PROOF OF DELIVERY (ePOD)

## 8.1 Objective

Allow drivers to submit delivery evidence and enable authorized staff to inspect the evidence and review AI-assisted document audit results.

The system must retain the original business delivery record independently of the AI-generated findings.

## 8.2 Driver Workflow

1. Driver opens an assigned delivery.
2. Driver confirms the delivery status.
3. Driver captures or selects the proof-of-delivery image.
4. Frontend validates file type and size.
5. Image is uploaded through an authenticated API.
6. Backend validates the request and compresses the image using Sharp.
7. Backend persists the image in private S3 storage.
8. Backend submits the image to OpenAI vision analysis.
9. Backend validates the structured audit response.
10. Backend persists the audit result.
11. Frontend displays submission status and review findings.
12. Authorized staff may approve or flag the audit for manual review.

## 8.3 Upload API

`POST /api/v1/deliveries/:deliveryId/epod`

Support `multipart/form-data`.

Expected fields may include:

- `image`
- `receiverName`, if entered by the driver.
- `deliveryNotes`.
- `capturedAt`.
- `clientMutationId`, for idempotency.

The backend must:

- Authenticate the driver.
- Confirm the driver is assigned to the delivery or has an explicitly permitted override.
- Validate the file's actual content, not just its extension.
- Restrict upload size and supported formats.
- Reject malformed images and decompression-bomb-style inputs.
- Strip unnecessary metadata when appropriate.
- Compress large images.
- Store the image privately in S3.
- Record a checksum and immutable object key.
- Persist the delivery submission before reporting success.
- Avoid logging image contents or sensitive document text.

## 8.4 AI Audit Schema

```typescript
export interface EpodAudit {
  receiverName: string;
  deliveryDate: string;
  damagedCargo: boolean;
  manifestAuditNotes: string;
}
```

The backend must validate the returned structure before persistence.

Treat missing signatures, illegible text, suspected cargo damage, and apparent discrepancies as review findings rather than automatically established facts.

Do not let model output directly authorize payment, close financial transactions, or permanently alter delivery records.

## 8.5 Response

```typescript
export interface EpodSubmissionResponse {
  epodId: string;
  deliveryId: string;
  status: 'submitted' | 'audit_pending' | 'review_required' | 'approved';
  audit?: EpodAudit;
  submittedAt: string;
}
```

Persist a distinct audit status so an AI outage does not erase or invalidate an otherwise successfully uploaded delivery document.

## 8.6 S3 Security

Use:

- Private bucket access.
- Least-privilege IAM permissions.
- Server-side encryption.
- Restricted object reads.
- Short-lived presigned download URLs.
- Configured retention and deletion policies.
- Access logging where appropriate.

Do not return permanent public S3 URLs.

---

# 9. FEATURE E: OFFLINE DELIVERY STATUS SYNCHRONIZATION

## 9.1 Objective

Allow drivers to record delivery-status updates when mobile connectivity is unavailable.

The frontend must clearly distinguish between a locally queued action and a server-confirmed delivery update.

## 9.2 Offline Queue

Use IndexedDB for durable browser-side queue storage.

Each queued mutation must include:

```typescript
export interface OfflineDeliveryMutation {
  id: string;
  deliveryId: string;
  clientMutationId: string;
  status: string;
  createdAt: string;
  payload: Record<string, unknown>;
  attempts: number;
}
```

Replace the broad `Record<string, unknown>` type with the actual delivery mutation contract once the existing model has been inspected.

The queue must support:

- Adding a mutation.
- Listing pending mutations.
- Updating retry counts.
- Marking a mutation as synchronized.
- Removing completed records.
- Recovering after a page reload.
- Preventing duplicate submissions.
- Handling stale or conflicting mutations.
- Reporting synchronization errors.

Do not store access tokens in IndexedDB queue records.

## 9.3 API Endpoints

### Submit a single status update

`PATCH /api/v1/deliveries/:deliveryId/status`

### Synchronize pending mutations

`POST /api/v1/deliveries/sync`

Example:

```typescript
export interface SyncDeliveryRequest {
  mutations: OfflineDeliveryMutation[];
}
```

The backend must process each mutation independently and return a result for each item.

A failed item must not cause unrelated valid mutations to disappear from the queue.

## 9.4 Synchronization Rules

When connectivity returns:

1. Detect online status.
2. Request the application's current authentication state.
3. Load queued mutations in creation order.
4. Submit them using authenticated HTTP requests.
5. Include each mutation's idempotency identifier.
6. Record successful server confirmations.
7. Remove only confirmed mutations.
8. Preserve failed mutations for retry or manual resolution.
9. Report conflicts, expired sessions, and permanent validation errors.
10. Refresh affected delivery records from the server.

Use Background Sync when supported, but do not depend on it because support varies by browser.

Provide foreground synchronization as a fallback.

## 9.5 Angular Service Worker Integration

Inspect whether the Angular application already uses Angular service worker support.

Do not install a second competing service worker without an explicit architecture decision.

If the existing application uses Angular's service worker:

- Preserve its registration.
- Integrate offline handling with the established service-worker architecture.
- Use a custom worker only if the requirements cannot be met by the existing setup.
- Define an explicit caching strategy for static assets and permitted GET requests.
- Never cache sensitive API responses indiscriminately.
- Never cache authenticated POST, PUT, PATCH, or DELETE responses as if they were authoritative.

The existing standalone `service-worker.js` implementation must be reviewed before integration because custom workers and Angular's generated worker have different responsibilities and lifecycle behavior.

## 9.6 User Experience

Display a clear state:

- Online.
- Offline.
- Pending synchronization.
- Synchronizing.
- Synchronized.
- Synchronization failed.
- Manual review required.

A queued mutation must never be presented as a confirmed server-side delivery update.

---

# 10. DATABASE AND PERSISTENCE

Inspect the existing database and ORM before implementing persistence.

Extend the current data model rather than creating duplicate asset, driver, or delivery tables.

If the existing application has no suitable database, recommend a relational database such as PostgreSQL for the ALM records.

## 10.1 Required Logical Entities

### Fleet telemetry

- `id`
- `assetId`
- `driverId`
- `longitude`
- `latitude`
- `heading`
- `speedKph`
- `telemetryTimestamp`
- `receivedAt`
- `eventId`

### Optimized route

- `id`
- `assetId`
- `createdBy`
- `status`
- `orderedDeliveryIds`
- `totalDistanceMeters`
- `estimatedDurationSeconds`
- `generatedAt`
- `confirmedAt`

### Route stop

- `id`
- `routeId`
- `deliveryId`
- `sequence`
- `status`
- `estimatedArrivalAt`
- `actualArrivalAt`

### Proof of delivery

- `id`
- `deliveryId`
- `submittedBy`
- `objectKey`
- `contentType`
- `fileSize`
- `checksum`
- `submittedAt`
- `auditStatus`

### ePOD audit

- `id`
- `epodId`
- `receiverName`
- `deliveryDate`
- `damagedCargo`
- `manifestAuditNotes`
- `modelName`
- `reviewStatus`
- `reviewedBy`
- `reviewedAt`

### Offline synchronization audit

- `id`
- `clientMutationId`
- `deliveryId`
- `userId`
- `status`
- `receivedAt`
- `processedAt`
- `errorCode`

These are logical fields, not a requirement to reproduce this exact schema. Match the existing database conventions, identifiers, tenant structure, and relationships.

## 10.2 Data Integrity

Implement:

- Foreign-key relationships where applicable.
- Appropriate indexes for frequently queried records.
- Tenant-aware queries where the application is multi-tenant.
- Idempotency constraints.
- Transactional updates for delivery status and route confirmation.
- Retention policies for high-volume telemetry.
- Audit trails for significant operational changes.

Avoid storing every high-frequency location update indefinitely without a defined retention and archival strategy.

---

# 11. API CONTRACT

Use `/api/v1` as the ALM API prefix unless the existing backend already has a standard versioning convention.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/fleet/telemetry` | Retrieve authorized fleet locations |
| GET | `/api/v1/fleet/:assetId/telemetry` | Retrieve vehicle telemetry history |
| POST | `/api/v1/routes/optimize` | Generate an optimized route |
| POST | `/api/v1/routes/:routeId/confirm` | Confirm and persist the proposed route |
| GET | `/api/v1/routes/:routeId` | Retrieve a route and its stops |
| POST | `/api/v1/eta/predict` | Calculate an ETA |
| POST | `/api/v1/deliveries/:deliveryId/epod` | Submit proof of delivery |
| GET | `/api/v1/deliveries/:deliveryId/epod` | Retrieve authorized ePOD metadata and audit status |
| GET | `/api/v1/epod/:epodId/download-url` | Generate an authorized short-lived document URL |
| PATCH | `/api/v1/deliveries/:deliveryId/status` | Update delivery status |
| POST | `/api/v1/deliveries/sync` | Synchronize queued offline mutations |
| GET | `/api/v1/alm/health` | Check ALM service health |

Implement the endpoints that are necessary for the completed workflow, including any missing route persistence and audit review endpoints.

For every endpoint, define:

- Request schema.
- Response schema.
- Authentication requirements.
- Authorization requirements.
- Validation rules.
- Error response format.
- Idempotency behavior where applicable.
- Rate limits where appropriate.

Use consistent HTTP status codes and a centralized error handler.

---

# 12. ANGULAR UI INTEGRATION

## 12.1 Fleet Monitoring Page

Extend the existing fleet dashboard.

Display:

- Interactive fleet map.
- Vehicle location markers.
- Fleet summary.
- Vehicle search and filters.
- Vehicle status.
- Driver and assignment information.
- Last location update.
- Selected vehicle details.
- Assigned route and ETA.

The map must remain usable on desktop and mobile.

Use clustering or another appropriate rendering strategy when vehicle counts make individual DOM markers inefficient.

## 12.2 Route Planning Page

Provide:

- Delivery stop selection.
- Starting point and destination.
- Assigned vehicle and driver.
- Route optimization action.
- Route geometry and stop sequence.
- Before-and-after route comparison.
- Estimated distance and duration.
- Validation messages.
- Route confirmation.
- Loading, failure, and retry states.

Do not persist a proposed route as an approved operational route until the required confirmation workflow succeeds.

## 12.3 Delivery Detail Page

Extend the existing delivery detail view with:

- Delivery status timeline.
- Assigned driver and vehicle.
- Current ETA.
- Proof-of-delivery upload.
- Image preview.
- Audit status.
- AI-generated audit findings.
- Authorized review actions.
- Offline synchronization status.

Reuse the application's existing design system and visual language.

## 12.4 Accessibility

Implement:

- Keyboard-accessible controls.
- Visible focus indicators.
- Accessible form labels.
- Appropriate ARIA attributes.
- Screen-reader announcements for meaningful status changes.
- Text alternatives for map-only information.
- Sufficient color contrast.
- Responsive layouts.
- Clear error messages.

Do not rely exclusively on marker color to communicate vehicle status.

---

# 13. SECURITY REQUIREMENTS

Implement the following controls before production deployment.

## Authentication and authorization

- Reuse the application's existing identity provider or authentication mechanism.
- Validate credentials on every protected HTTP endpoint.
- Authenticate Socket.IO connections.
- Authorize each asset, delivery, route, and document access.
- Enforce tenant boundaries on the backend.
- Apply role-based and resource-level access controls.

## Secrets and credentials

Keep all privileged Mapbox, OpenAI, and AWS credentials on the backend.

Never commit `.env` files.

Provide `.env.example` with variable names but no actual credentials.

## Network security

- Restrict CORS to approved application origins.
- Add request rate limiting.
- Configure request body size limits.
- Apply timeouts to external services.
- Validate all request inputs.
- Use HTTPS in production.
- Apply appropriate security headers.
- Avoid exposing stack traces to clients.

## Privacy

Driver location and delivery documents are sensitive operational data.

Implement access logging, retention controls, least-privilege access, and appropriate data minimization.

Do not expose personal delivery information through unrestricted WebSocket broadcasts.

## AI safety

Treat document content as untrusted input.

Validate model responses.

Do not execute instructions contained in uploaded documents.

Do not allow model-generated findings to bypass human review for consequential decisions.

---

# 14. ERROR HANDLING AND RESILIENCY

Define a consistent error response:

```typescript
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    retryable: boolean;
  };
}
```

The frontend must distinguish between:

- Validation errors.
- Authorization errors.
- Network failures.
- External provider errors.
- Rate limits.
- Server failures.
- Offline queue failures.
- Conflicting delivery updates.

Implement structured server logging with request IDs.

Do not log credentials, authorization headers, full document contents, or unnecessary personal information.

External API requests must have bounded timeouts and appropriate retry behavior.

Do not blindly retry non-idempotent delivery mutations.

If S3 persistence succeeds but OpenAI analysis fails, retain the document and mark its audit as pending or failed so that the audit can be retried independently.

If the database is unavailable, do not broadcast an event that claims a persistent business transaction has succeeded.

---

# 15. TESTING REQUIREMENTS

Use the repository's existing test framework where possible.

## 15.1 Angular Unit Tests

Test:

- Telemetry event validation.
- Socket connection lifecycle.
- Telemetry state updates.
- Stale location handling.
- Route optimization request handling.
- ETA display.
- ePOD upload validation.
- Offline queue behavior.
- Synchronization conflict handling.
- Error-state rendering.

Mock Socket.IO and external APIs in unit tests.

## 15.2 Backend Unit Tests

Test:

- Coordinate validation.
- Route optimization response mapping.
- ETA calculations.
- Authentication and authorization.
- Telemetry validation.
- S3 upload error handling.
- OpenAI response validation.
- Delivery status transitions.
- Idempotent mutation handling.
- Tenant isolation.

## 15.3 Integration Tests

Verify:

1. An authenticated driver sends a location update.
2. An authorized fleet manager receives the update.
3. An unauthorized client cannot subscribe to another tenant's fleet.
4. A dispatcher optimizes a route and confirms it.
5. A driver uploads an ePOD image.
6. The document is stored privately.
7. An audit record is persisted.
8. A queued offline delivery update synchronizes after reconnection.
9. Replayed mutations do not duplicate delivery status changes.
10. External provider failures return controlled errors.

## 15.4 End-to-End Tests

Test complete workflows using the existing browser testing framework if available.

External services must be mocked or run in a dedicated test environment.

Do not require live OpenAI calls or real AWS uploads for routine unit tests.

---

# 16. PERFORMANCE AND SCALABILITY

Design the module so it can grow with fleet size and telemetry frequency.

Requirements:

- Reuse Socket.IO connections.
- Avoid duplicate event subscriptions.
- Batch or throttle visual map updates.
- Use appropriate database indexes.
- Cache suitable route and ETA results.
- Enforce provider request limits.
- Bound concurrent image-processing and AI requests.
- Limit uploaded file sizes.
- Establish a telemetry retention strategy.
- Monitor WebSocket connection counts.
- Measure event-processing latency.
- Use a shared Socket.IO adapter, such as a Redis-backed adapter, if horizontally scaling across multiple server instances requires it.
- Use a durable job queue if AI processing and other background operations outgrow synchronous request handling.

Do not introduce Redis, a message broker, or a job queue without identifying the specific scaling or reliability requirement it addresses.

---

# 17. CONFIGURATION

Provide a documented `.env.example`.

Suggested variables:

```dotenv
NODE_ENV=development
PORT=5000

CORS_ORIGINS=http://localhost:4200

MAPBOX_TOKEN=
MAPBOX_TIMEOUT_MS=10000

OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-4o
OPENAI_TIMEOUT_MS=30000

AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_SERVER_SIDE_ENCRYPTION=AES256

DATABASE_URL=

LOG_LEVEL=info
```

Adapt the database configuration to the existing application's ORM.

Do not expose privileged environment variables through Angular's build-time environment files.

Angular may contain a public backend API base URL and, where needed, a restricted public Mapbox token.

---

# 18. IMPLEMENTATION PHASES

Implement ALM incrementally.

## Phase 1: Repository Assessment and Architecture

- Inspect the Angular application.
- Identify existing fleet, driver, dispatch, delivery, map, and authentication implementations.
- Identify the backend and database architecture.
- Document the integration points.
- Produce a concise implementation plan.
- Identify conflicts with existing code before making changes.

**Exit criteria:** A repository-specific implementation plan is approved, with no duplicate core models or services introduced unnecessarily.

## Phase 2: Backend Foundation

- Establish configuration validation.
- Implement API routing.
- Implement authentication and authorization integration.
- Add request validation and centralized error handling.
- Add persistence interfaces.
- Add health checks and structured logging.

**Exit criteria:** The service starts correctly, validates its configuration, and exposes protected API infrastructure.

## Phase 3: Real-Time Fleet Telemetry

- Implement authenticated Socket.IO connections.
- Validate driver location events.
- Persist telemetry according to the agreed retention strategy.
- Broadcast authorized updates.
- Integrate the Angular socket service.
- Extend the existing fleet map.

**Exit criteria:** An authorized driver can report a location and an authorized monitoring client can see the updated vehicle position.

## Phase 4: Route Optimization and ETA

- Integrate Mapbox Optimization.
- Map optimized stops back to delivery records.
- Add route persistence and confirmation.
- Integrate traffic-aware ETA calculations.
- Add Angular route planning and ETA components.

**Exit criteria:** Dispatchers can review and confirm an optimized route and see a traffic-aware ETA.

## Phase 5: ePOD and AI Auditing

- Implement secure image upload.
- Compress images using Sharp.
- Persist images in private S3 storage.
- Integrate OpenAI vision.
- Validate and persist structured audit findings.
- Implement retryable audit processing.
- Add Angular upload and review interfaces.

**Exit criteria:** Drivers can submit proof of delivery, and authorized staff can retrieve the document and review its audit status.

## Phase 6: Offline Synchronization

- Integrate with the existing service-worker architecture.
- Implement IndexedDB queue persistence.
- Implement idempotent synchronization endpoints.
- Handle authentication expiry and conflicts.
- Add synchronization status indicators.

**Exit criteria:** A delivery-status update can be queued offline, survive a page reload, and synchronize without creating duplicate updates.

## Phase 7: Testing and Production Hardening

- Run existing regression tests.
- Add ALM unit and integration tests.
- Validate authorization boundaries.
- Test external service failures.
- Check mobile responsiveness and accessibility.
- Review logs and secrets handling.
- Document deployment, configuration, and recovery procedures.

**Exit criteria:** The ALM workflows pass the defined acceptance tests without breaking existing logistics application functionality.

---

# 19. ACCEPTANCE CRITERIA

The implementation is complete when all of the following are satisfied.

### Fleet telemetry

- Authenticated drivers can report valid locations.
- Invalid coordinates and unauthorized asset updates are rejected.
- Authorized dashboards receive real-time updates.
- Reconnection restores current fleet state.
- Stale telemetry is identified.
- Tenant and asset boundaries are enforced.

### Route optimization

- Dispatchers can submit eligible delivery stops.
- Mapbox returns an optimized sequence.
- The backend maps the sequence to the correct delivery IDs.
- The frontend displays the proposed route.
- Authorized users can confirm the route.
- Provider failures are handled gracefully.

### Predictive ETA

- ETA calculations use a traffic-aware route duration.
- Traffic adjustment is bounded and documented.
- The response includes the baseline and adjusted duration.
- Requests are rate-limited or cached appropriately.
- The UI identifies stale estimates.

### Proof of delivery

- Authorized drivers can upload supported images.
- Images are validated and compressed.
- Documents are stored privately.
- AI responses are validated before persistence.
- Failed AI analysis does not erase the uploaded document.
- Authorized reviewers can inspect findings.
- Audit decisions remain traceable.

### Offline synchronization

- Delivery updates are queued when transport fails.
- Queued actions survive reloads.
- Successful synchronization removes only confirmed mutations.
- Repeated requests do not duplicate business operations.
- Expired sessions and conflicting updates are surfaced.
- The UI distinguishes queued actions from server-confirmed changes.

### Application quality

- Existing Angular routes and functionality continue to work.
- No privileged credentials are exposed to the browser.
- Components, services, models, and APIs are typed.
- Loading, empty, error, and offline states are implemented.
- Tests cover important business and security rules.
- Deployment and configuration instructions are documented.

---

# 20. FINAL IMPLEMENTATION INSTRUCTIONS FOR THE CODING AGENT

Act as a principal Angular 19 engineer and backend systems architect.

Implement this specification directly within the existing logistics application's repository.

Follow these rules:

1. Inspect the repository before editing any files.
2. Identify existing services, components, models, APIs, and authentication flows that ALM should reuse.
3. Do not replace the existing application or rewrite unrelated features.
4. Do not assume a particular database, ORM, authentication provider, or state-management library without inspecting the project.
5. Produce complete, executable implementations for each phase.
6. Do not leave TODO comments, empty handlers, fake API responses, or placeholder business logic in completed features.
7. Use strict TypeScript contracts in Angular and runtime validation at API boundaries.
8. Keep third-party credentials on the server.
9. Ensure frontend and backend request and response contracts match exactly.
10. Implement proper cleanup for subscriptions, WebSocket connections, and map resources.
11. Add tests for implemented business logic and failure cases.
12. Run the available lint, build, and test commands after each major phase.
13. Resolve errors caused by the implementation rather than suppressing them with unsafe casts or disabled checks.
14. Document any requirement that cannot be implemented because the existing repository lacks a necessary backend, database, credential, or infrastructure capability.
15. Do not claim a feature is complete unless its end-to-end workflow has been implemented and verified.

Start with repository assessment, then implement the module incrementally in dependency order.

Act as a senior frontend engineer. Build a highly accessible dashboard component featuring a 3-dot overflow action menu containing exactly three functional actions: "View", "Edit", and "Delete".

Follow these precise functional and visual specifications:
1. TRIGGER: Use a vertical ellipsis (:) icon centered inside an interactive hit-target of at least 44x44px. 
2. DROPDOWN MENU: When clicked, an absolutely positioned menu container must float directly below/aligned to the right side of the trigger button with a high z-index (z-index: 50). 
3. INTERACTION & DISMISS: Implement complete "light dismiss" functionality. The menu must immediately close if the user clicks outside, selects an action, or presses the 'Escape' key. Ensure only one menu can be open at a time if mapped across a data table row.
4. VISUAL HIERARCHY: Structure the options vertically in this exact order: 
   - "View" (Standard neutral dark text styling)
   - "Edit" (Standard neutral dark text styling)
   - "Delete" (Destructive red text treatment with a soft red background on hover)
5. DELETION SAFEGUARD: Clicking "Delete" must close the dropdown and instantly open a screen-centered confirmation modal with an overlay backdrop. The modal needs a primary red "Delete" button and a neutral gray "Cancel" button.

Provide clean, modular, production-ready code with complete ARIA attributes (role="menu", role="menuitem", aria-haspopup, aria-expanded) for full web accessibility compliance.

At the end, provide:

- A summary of files created and modified.
- An architecture and integration summary.
- A list of API endpoints and Socket.IO events.
- Configuration and deployment instructions.
- Tests executed and their results.
- Any remaining external prerequisites.
- Any known limitations or follow-up tasks.

The result must be an integrated ALM feature within the existing Angular 19 logistics application, not an independent demo that runs separately from the application's real fleet, dispatch, and delivery workflows.