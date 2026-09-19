# LOGISTICS OPERATIONS PLATFORM — AI IMPLEMENTATION SPECIFICATION

## ROLE

You are a senior software architect and full-stack engineer specializing in Angular enterprise applications and logistics management systems.

You are working on an **existing Angular logistics application**.

Your task is to inspect the existing codebase, understand its architecture, and extend it into a functional logistics operations platform.

Do NOT rebuild the application from scratch.

Do NOT replace working functionality unnecessarily.

Do NOT create a separate application.

Preserve the existing design system, routing structure, components, dependencies, and working functionality wherever possible.

---

# 1. FIRST: AUDIT THE EXISTING PROJECT

Before writing code, inspect the entire relevant project structure. Build in phases and inform me when a phase is done.

Identify:

* Angular version
* TypeScript version
* existing routing
* standalone components/modules
* existing dashboard
* existing sidebar/navigation
* existing header
* existing map implementation
* existing dispatch functionality
* existing services
* existing models/interfaces
* existing API integrations
* existing state management
* existing authentication
* existing UI component library
* existing styling system
* existing environment configuration
* existing mock data
* existing backend/API contracts

Do not assume these technologies are present.

Use what already exists whenever practical.

Before making major architectural changes, determine how the current application is structured.

---

# 2. PRIMARY OBJECTIVE

Transform the existing application into a centralized logistics operations platform.

The platform must connect the following workflow:

Customer
→ Order
→ Load
→ Route
→ Driver
→ Vehicle
→ Dispatch
→ Live Tracking
→ ETA
→ Delivery
→ Exception
→ Analytics

The application should feel like a real enterprise logistics operations system, not a collection of disconnected demo pages.

---

# 3. CORE PRODUCT CONCEPT

The application is an **Operations Command Center**.

The primary user should be able to answer:

1. What is happening right now?
2. Which deliveries are active?
3. Where are the vehicles?
4. Which deliveries are at risk?
5. Which drivers and vehicles are available?
6. Which loads have been dispatched?
7. Which deliveries have failed?
8. What requires immediate attention?
9. What is causing delays?
10. How is operational performance changing?

The dashboard must therefore prioritize:

* live operational status
* exceptions
* active loads
* vehicle tracking
* delivery performance
* ETA/SLA risks

---

# 4. APPLICATION ARCHITECTURE

Use a feature-oriented Angular architecture.

Target structure:

src/app/

core/

* auth/
* guards/
* interceptors/
* http/
* services/
* config/

shared/

* components/
* directives/
* pipes/
* models/
* utils/

features/

* dashboard/
* orders/
* loads/
* dispatch/
* routes/
* fleet/
* drivers/
* tracking/
* deliveries/
* exceptions/
* carriers/
* analytics/

Adapt this structure to the existing project instead of blindly recreating it.

Use lazy-loaded feature routes where appropriate.

Keep business logic outside presentation components.

---

# 5. ARCHITECTURAL RULES

Follow these rules:

### Components

Components are responsible primarily for:

* displaying UI
* handling user interactions
* coordinating presentation state

Do not put large business algorithms inside components.

### Services

Services should handle:

* API communication
* business operations
* reusable application logic
* external integrations

### Models

Use TypeScript interfaces/types for domain models.

### State

Use the application's existing state-management approach if one already exists.

If no global state solution exists:

* use Angular Signals for local/reactive application state where appropriate;
* use RxJS for asynchronous streams and event streams;
* do not introduce a large state-management library unless there is a demonstrated need.

### Backend

Business-critical calculations such as:

* route optimization
* ETA calculation
* pricing
* authorization
* carrier selection

must not rely exclusively on frontend logic.

---

# 6. DOMAIN MODELS

Create or adapt the following domain models.

## Customer

interface Customer {
id: string;
name: string;
email?: string;
phone?: string;
address: Address;
}

## Address

interface Address {
id: string;
formattedAddress: string;
latitude: number;
longitude: number;
city: string;
state: string;
postalCode?: string;
verified: boolean;
}

## Package

interface Package {
id: string;
weight: number;
dimensions?: {
length: number;
width: number;
height: number;
};
description?: string;
}

## DeliveryWindow

interface DeliveryWindow {
start: string;
end: string;
}

## Order

interface Order {
id: string;
customerId: string;

pickupAddress: Address;
deliveryAddress: Address;

packages: Package[];

priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

deliveryWindow?: DeliveryWindow;

status:
| 'PENDING'
| 'CONFIRMED'
| 'READY'
| 'ASSIGNED'
| 'IN_TRANSIT'
| 'DELIVERED'
| 'FAILED'
| 'CANCELLED';

createdAt: string;
updatedAt: string;
}

## Load

interface Load {
id: string;
reference: string;

orderIds: string[];

driverId?: string;
vehicleId?: string;

routeId?: string;

status:
| 'PLANNING'
| 'READY'
| 'DISPATCHED'
| 'IN_TRANSIT'
| 'COMPLETED'
| 'CANCELLED';

scheduledDate: string;

totalStops: number;
completedStops: number;
}

## Driver

interface Driver {
id: string;
name: string;
phone: string;

status:
| 'AVAILABLE'
| 'ASSIGNED'
| 'DRIVING'
| 'OFFLINE';

currentVehicleId?: string;
}

## Vehicle

interface Vehicle {
id: string;
registrationNumber: string;

type:
| 'VAN'
| 'TRUCK'
| 'BIKE'
| 'CAR';

capacity: number;

status:
| 'AVAILABLE'
| 'ASSIGNED'
| 'IN_TRANSIT'
| 'MAINTENANCE'
| 'OFFLINE';

fuelLevel?: number;

currentLocation?: GeoLocation;
}

## GeoLocation

interface GeoLocation {
latitude: number;
longitude: number;
}

## Route

interface Route {
id: string;

loadId: string;

stops: RouteStop[];

totalDistance: number;
estimatedDuration: number;

status:
| 'PLANNED'
| 'ACTIVE'
| 'COMPLETED'
| 'CANCELLED';
}

## RouteStop

interface RouteStop {
id: string;

orderId: string;

sequence: number;

address: Address;

estimatedArrival?: string;
actualArrival?: string;

status:
| 'PENDING'
| 'ARRIVED'
| 'COMPLETED'
| 'FAILED';
}

## VehiclePosition

interface VehiclePosition {
vehicleId: string;

latitude: number;
longitude: number;

speed: number;
heading?: number;

timestamp: string;
}

## DeliveryETA

interface DeliveryETA {
stopId: string;

estimatedArrival: string;

deliveryWindowStart?: string;
deliveryWindowEnd?: string;

status:
| 'ON_TIME'
| 'AT_RISK'
| 'LATE';
}

## DeliveryException

interface DeliveryException {
id: string;

type:
| 'LATE_DELIVERY'
| 'ADDRESS_ERROR'
| 'FAILED_ATTEMPT'
| 'VEHICLE_BREAKDOWN'
| 'DRIVER_DELAY'
| 'ROUTE_DEVIATION'
| 'CAPACITY_ISSUE';

severity:
| 'LOW'
| 'MEDIUM'
| 'HIGH'
| 'CRITICAL';

loadId?: string;
orderId?: string;
vehicleId?: string;

description: string;

status:
| 'OPEN'
| 'ACKNOWLEDGED'
| 'RESOLVED';

createdAt: string;
}

---

# 7. OPERATIONS DASHBOARD

Upgrade the existing dashboard rather than creating a disconnected replacement.

The dashboard must contain:

## KPI section

Display:

* Active Loads
* Active Vehicles
* On-Time Delivery %
* At-Risk Deliveries
* Failed Deliveries
* Fuel Cost

Example:

Active Loads: 142
Active Vehicles: 61
On-Time Delivery: 91%
At-Risk: 7
Failed Deliveries: 4
Fuel Cost: ₦1.24M

Do not hard-code these values in the final implementation.

They should come from the dashboard service/API.

---

# 8. LIVE OPERATIONS MAP

Use the existing map implementation if one exists.

The map should display:

* active vehicles
* vehicle status
* delivery stops
* active routes
* exceptions
* selected vehicle
* selected load

Clicking a vehicle should display:

* vehicle ID
* registration number
* driver
* speed
* current load
* current stop
* ETA
* status

Clicking a delivery stop should display:

* customer
* order
* delivery status
* ETA
* delivery window
* exception status

---

# 9. ACTIVE LOADS

Create an Active Loads section/table.

Columns:

* Load
* Driver
* Vehicle
* Stops
* Progress
* ETA
* Status
* Risk

Support:

* search
* filtering
* sorting
* pagination
* load detail navigation

---

# 10. EXCEPTION CENTER

Create a highly visible exception section.

Display:

* critical exceptions
* high-priority exceptions
* medium exceptions
* resolved exceptions

Example:

CRITICAL
Vehicle breakdown — TRK-102

HIGH
Delivery likely to miss SLA — LD-203

MEDIUM
Address verification required — ORD-104

Actions:

* View
* Acknowledge
* Assign
* Resolve

The dashboard should prioritize operational exceptions instead of showing only statistics.

---

# 11. ORDER MANAGEMENT

Create an Orders feature.

Required functionality:

* list orders
* search
* filter
* create order
* edit order
* view order
* cancel order
* assign order to load
* track order status

Order detail should show:

Customer
Pickup
Destination
Packages
Priority
Delivery Window
Current Status
Load
Driver
Vehicle
ETA
Delivery History

---

# 12. ADDRESS VALIDATION

When an order is created:

1. Accept customer address.
2. Validate address.
3. Geocode address.
4. Store latitude/longitude.
5. Mark address as verified/unverified.
6. Display warning when validation fails.

Example:

Address:

"12 Example Street"

should not be treated only as a string.

It should become:

Address

* latitude
* longitude
* verification status.

Create an abstraction for the geocoding provider so it can be replaced later.

---

# 13. LOAD MANAGEMENT

Create a Loads feature.

Users should be able to:

* create load
* add orders
* remove orders
* assign driver
* assign vehicle
* generate route
* view route
* dispatch load
* cancel load
* monitor progress

Load detail page:

Load reference
Driver
Vehicle
Total stops
Completed stops
Remaining stops
ETA
Route
Delivery status
Exceptions

---

# 14. DISPATCH WORKFLOW

Implement:

Select Orders
↓
Create Load
↓
Select Driver
↓
Select Vehicle
↓
Validate Capacity
↓
Generate Route
↓
Review Route
↓
Dispatch

Before dispatch, validate:

* driver availability
* vehicle availability
* vehicle capacity
* route feasibility
* delivery window conflicts

Do not allow dispatch when critical validation fails.

Display clear validation messages.

---

# 15. DRIVER MANAGEMENT

Create a Drivers feature.

Display:

* name
* phone
* status
* assigned vehicle
* current load
* current location
* current route
* performance

Driver statuses:

AVAILABLE
ASSIGNED
DRIVING
OFFLINE

Support:

* create
* edit
* view
* search
* filter
* assign

---

# 16. FLEET MANAGEMENT

Create a Fleet feature.

Dashboard metrics:

* total vehicles
* active
* available
* maintenance
* offline

Vehicle detail:

* registration
* vehicle type
* capacity
* driver
* current location
* fuel
* current load
* route
* status

---

# 17. ROUTE MANAGEMENT

Create route planning functionality.

Display:

* ordered stops
* distance
* estimated duration
* delivery windows
* route status
* map visualization

Allow users to:

* create route
* reorder stops
* optimize route
* preview route
* assign route to load

---

# 18. ROUTE OPTIMIZATION

Do not implement a fake frontend-only "optimization" button.

Create a service boundary:

Angular
↓
Route API
↓
Optimization Service
↓
Routing/Mapping Provider
↓
Optimized Route
↓
Angular

Optimization should consider:

* distance
* vehicle capacity
* delivery windows
* driver availability
* current vehicle location
* priority
* estimated duration

If the real optimization backend is unavailable during development, implement a clearly separated mock optimization service.

Do not mix mock logic into production components.

---

# 19. REAL-TIME TRACKING

Create a TrackingService.

It should expose vehicle updates through an observable/stream.

Conceptually:

Driver/GPS
↓
Backend
↓
WebSocket
↓
TrackingService
↓
Signals/RxJS
↓
Map

Example:

vehiclePosition$: Observable<VehiclePosition>

The system should update vehicle markers without requiring a page refresh.

If a real GPS/WebSocket backend is unavailable, implement a development simulation behind the same service interface.

The UI should not need to know whether the data is real or simulated.

---

# 20. ETA ENGINE

Every active route stop should have an ETA.

Display:

ON TIME
AT RISK
LATE

Example:

Delivery window:
10:00–12:00

ETA:
11:35

Status:
ON TIME

If ETA becomes 12:40:

Status:
LATE

Create reusable ETA calculation/status logic.

Do not duplicate ETA logic across components.

---

# 21. DELIVERY MANAGEMENT

Create a Deliveries feature.

Delivery statuses:

* Pending
* Out for Delivery
* Arrived
* Delivered
* Failed

When a delivery fails, require a reason.

Reasons:

* Incorrect address
* Customer unavailable
* Access problem
* Refused delivery
* Vehicle issue
* Other

Failed deliveries should automatically create an exception.

---

# 22. FIRST-ATTEMPT DELIVERY FAILURE WORKFLOW

Before dispatch:

Address validation
↓
Geocoding
↓
Delivery zone validation
↓
Route validation
↓
Customer confirmation

After failed attempt:

Delivery Failed
↓
Failure Reason
↓
Exception Created
↓
Customer Notification
↓
Reschedule OR Return

---

# 23. CARRIER MANAGEMENT

Support:

* company-owned fleet
* third-party logistics providers
* parcel carriers
* independent drivers

Carrier model:

Carrier

* id
* name
* type
* status

Track:

* loads
* deliveries
* on-time rate
* failure rate
* cost
* performance

Do not tightly couple the application to a single carrier API.

Create an abstraction layer.

---

# 24. ANALYTICS

Create an Analytics feature.

Include:

* delivery performance
* on-time percentage
* failed attempts
* average delivery time
* route distance
* cost per delivery
* fuel cost
* vehicle utilization
* carrier performance

Use real API data when available.

Use development fixtures only when backend endpoints do not yet exist.

---

# 25. API SERVICES

Create or adapt services such as:

order.service.ts
load.service.ts
dispatch.service.ts
route.service.ts
fleet.service.ts
driver.service.ts
tracking.service.ts
delivery.service.ts
exception.service.ts
carrier.service.ts
dashboard.service.ts
analytics.service.ts

Example:

getLoads()
getLoad(id)
createLoad()
updateLoad()
dispatchLoad()

Use typed HTTP responses.

Do not use `any` unless absolutely unavoidable.

---

# 26. API CONTRACT

Where backend support exists, integrate with endpoints similar to:

GET /api/dashboard

GET /api/orders
POST /api/orders
GET /api/orders/:id

GET /api/loads
POST /api/loads
GET /api/loads/:id

GET /api/drivers
GET /api/vehicles

POST /api/dispatch

GET /api/routes/:id
POST /api/routes/optimize

GET /api/tracking/vehicles

GET /api/deliveries

PATCH /api/deliveries/:id

GET /api/exceptions
PATCH /api/exceptions/:id

GET /api/carriers

These are reference contracts.

Adapt them to the actual backend instead of breaking existing APIs.

---

# 27. LOADING, EMPTY AND ERROR STATES

Every data-driven feature must support:

Loading
Success
Empty
Error

Example:

Loading:
"Loading active vehicles..."

Empty:
"No active vehicles found."

Error:
"Unable to load active vehicles."
[Retry]

Never leave blank screens when an API fails.

---

# 28. RESPONSIVE DESIGN

The application must work on:

* desktop
* laptop
* tablet
* mobile

The primary operations dashboard should be optimized for desktop but remain usable on smaller screens.

Do not simply shrink the desktop UI.

Tables should support:

* horizontal scrolling
* responsive layouts
* mobile-friendly detail views

---

# 29. UX REQUIREMENTS

The UI should feel like a professional enterprise logistics platform.

Use:

* clear hierarchy
* consistent spacing
* clear status indicators
* meaningful icons
* readable tables
* useful empty states
* clear action buttons
* confirmation dialogs for destructive operations
* toast/notification feedback

Avoid:

* unnecessary animations
* excessive gradients
* decorative UI that does not help operations
* excessive cards
* fake AI functionality
* hard-coded statistics

Prioritize information density and operational clarity.

---

# 30. STATUS COLORS

Use the existing design system if available.

Semantically distinguish:

Success:
On time
Delivered
Available

Warning:
At risk
Pending
Needs attention

Error:
Failed
Late
Critical

Neutral:
Offline
Cancelled
Completed

Do not introduce a completely new color system if the project already has one.

---

# 31. STATE MANAGEMENT

Use Signals for appropriate UI/application state.

Example:

selectedVehicle
activeVehicles
selectedLoad
selectedStatus
dashboardMetrics

Use RxJS for:

* HTTP streams
* WebSocket streams
* real-time vehicle updates
* asynchronous workflows

Do not create a single giant global state object containing the entire application.

Keep state close to the feature that owns it.

---

# 32. SECURITY

Respect existing authentication.

Implement:

* authenticated API requests
* route guards where appropriate
* permission checks
* role-aware actions

Potential roles:

Admin
Dispatcher
Fleet Manager
Driver
Operations Manager
Customer Service
Finance

Do not rely exclusively on frontend permission checks for security.

---

# 33. TESTING

Add tests for critical functionality.

## Unit tests

Test:

* services
* ETA calculations
* status calculations
* route transformations
* exception creation
* validation
* state transformations

## Component tests

Test:

* rendering
* user interaction
* loading state
* empty state
* error state
* filtering

## E2E / integration workflow

Test:

Create Order
↓
Create Load
↓
Assign Driver
↓
Assign Vehicle
↓
Generate Route
↓
Dispatch
↓
Track Vehicle
↓
Complete Delivery
↓
Update Dashboard

This is the primary end-to-end business workflow.

---

# 34. DEVELOPMENT MOCK MODE

If backend APIs are incomplete, create a clean mock-data layer.

Example:

MockOrderService
MockLoadService
MockTrackingService

The application should use interfaces so these can later be replaced with real API services.

Do NOT scatter mock arrays throughout components.

Bad:

const vehicles = [...]

inside a component.

Good:

TrackingService
↓
MockTrackingProvider

---

# 35. DEMO DATA

Create realistic logistics demo data.

Examples:

Loads:

LD-1001
LD-1002
LD-1003

Vehicles:

TRK-101
TRK-102
VAN-201

Drivers:

John Doe
Sarah Williams
Michael Adams

Orders should have realistic:

* addresses
* coordinates
* delivery windows
* priorities
* statuses

Use geographically coherent coordinates for map demonstrations.

---

# 36. PERFORMANCE

Implement:

* lazy-loaded feature routes
* pagination
* debounced search
* efficient change detection
* efficient map marker updates
* avoidance of unnecessary HTTP requests
* cleanup of subscriptions
* efficient rendering of large datasets

Do not continuously poll APIs if a WebSocket/event stream is available.

---

# 37. IMPLEMENTATION ORDER

Do not implement all features simultaneously.

Implement in this order:

## Phase 1

Audit existing project.

Then establish:

* domain models
* feature structure
* shared interfaces
* service boundaries

## Phase 2

Upgrade dashboard:

* KPI cards
* active loads
* exceptions
* live map
* delivery metrics

## Phase 3

Implement:

Orders
Customers
Addresses

## Phase 4

Implement:

Loads
Drivers
Vehicles
Dispatch

## Phase 5

Implement:

Routes
Route optimization
ETA

## Phase 6

Implement:

Tracking
WebSocket/event architecture
Vehicle movement simulation if required

## Phase 7

Implement:

Deliveries
Failed delivery workflow
Exceptions

## Phase 8

Implement:

Carriers
Analytics
Performance reporting

---

# 38. IMPORTANT IMPLEMENTATION RULE

Work incrementally.

After each major phase:

1. Build the application.
2. Run TypeScript compilation.
3. Run tests.
4. Fix errors.
5. Verify routing.
6. Verify existing functionality.
7. Only then continue.

Do not make hundreds of changes without checking whether the application still builds.

---

# 39. DEFINITION OF DONE

A feature is complete only when:

* UI exists
* model exists
* service exists
* API integration exists or mock provider exists
* loading state exists
* empty state exists
* error state exists
* validation exists
* user actions work
* state updates correctly
* related dashboard data updates
* tests exist
* existing application functionality remains intact

---

# 40. FINAL PRODUCT WORKFLOW

The completed application must support this connected workflow:

Customer creates order
↓
Address is validated
↓
Order becomes ready
↓
Dispatcher creates load
↓
Orders are added to load
↓
Driver is assigned
↓
Vehicle is assigned
↓
Capacity is validated
↓
Route is generated
↓
Route is optimized
↓
Load is dispatched
↓
Vehicle begins tracking
↓
ETA is calculated
↓
Dashboard receives real-time updates
↓
Potential SLA problem is detected
↓
Exception is created
↓
Dispatcher investigates
↓
Delivery occurs
↓
Proof/status is recorded
↓
Failed delivery creates exception when applicable
↓
Load is completed
↓
Analytics are updated

---

# 41. MOST IMPORTANT REQUIREMENT

Do not build a collection of disconnected dashboard pages.

Build a connected logistics operating system.

The relationship between the features is:

Customer
→ Order
→ Load
→ Route
→ Driver
→ Vehicle
→ Dispatch
→ Tracking
→ ETA
→ Delivery
→ Exception
→ Analytics

Every major feature should consume or produce data that participates in this workflow.

The final result should feel like a real logistics operations platform that an operations manager or dispatcher could use to understand and control daily delivery operations.

Before implementing new architecture, inspect and reuse the existing project's architecture and UI components wherever practical.
