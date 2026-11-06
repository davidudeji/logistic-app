Inventory Management System for the Logistics App

In logistics, inventory is stock that moves, so the system must connect warehouse stock to shipments, trips and invoices rather than just count items on shelves. This document lists the features needed, grouped by area, with a suggested build order at the end. Context: Angular frontend, Nigerian market, existing quotes/invoice module and live tracking.
1. Core inventory (the foundation)
• Item/SKU master: name, SKU, barcode/QR, category, dimensions, weight, unit of measure (box, pallet, piece), photos, custom attributes
• Multi-warehouse and location hierarchy: warehouse → zone → aisle → rack → bin; stock is tracked per location, not just per item
• Stock levels: on-hand, reserved, available, in-transit, damaged/quarantined
• Stock movements ledger: every change is an immutable record (receipt, pick, transfer, adjustment, return), which gives a full audit trail
• Batch/lot and serial tracking: needed for FMCG, pharma and electronics, plus expiry dates with FEFO (first-expired, first-out) picking
• Unit of measure conversion: e.g. 1 carton = 24 pieces
2. Inbound (receiving)
• Purchase orders / expected shipments with supplier details
• Goods receiving (GRN): check delivered quantities against the PO and flag shortages, overages or damage
• Put-away suggestions: recommend a bin based on item size, category or velocity
• Quality inspection step before stock becomes available
3. Outbound (fulfilment)
• Customer orders / delivery requests that reserve stock automatically
• Pick lists, with batch or wave picking to reduce walking
• Pack and dispatch: packing slips, waybills and barcode labels
• Proof of delivery (POD): signature, photo or OTP confirmation from the receiver
• Returns and reverse logistics (RMA): restock, repair or write off
4. Stock control
• Cycle counts and full stock takes: mobile counting, variance reports, approval workflow for adjustments
• Reorder points and safety stock, with low-stock alerts
• Inter-warehouse transfers with an in-transit status
• Stock adjustments with reason codes: theft, damage, expiry, counting error
• Reservations and allocation rules: which order gets stock first
• ABC analysis: classify items by value or movement, which also drives smarter bin placement
5. Logistics-specific features (your edge)
• Link inventory to shipments: dispatched stock attaches to a trip, vehicle and driver, so live tracking shows what is on each truck
• Vehicle load planning: weight and volume capacity checks, plus a load manifest
• Stock-in-transit visibility: items that left the warehouse but are not yet delivered
• Third-party logistics (3PL) / multi-client mode: each client gets its own inventory, billing and portal
• Cross-docking: goods go straight from inbound to outbound without storage
• Consignment tracking and customer-owned vs. company-owned stock
6. Billing and finance
These features tie into the quotes/invoice module and its three PDF templates.
• Storage and handling fees: charge per pallet per day, per pick or per receipt, then auto-generate invoices
• Inventory valuation: FIFO, weighted average and landed cost
• Supplier and customer ledgers
• Tax handling: VAT (7.5% in Nigeria), Naira and multi-currency support
• Damage and loss claims: link a claim to the shipment and the stock record
7. Reporting and analytics
• Dashboard: stock value, low-stock count, pending receipts, orders to pick, stock aging
• Reports: movement history, slow-moving and dead stock, stockout rate, turnover, fill rate, shrinkage
• Demand forecasting: start with simple moving averages, add ML later
• Exports: CSV, Excel and PDF
• Scheduled email reports, e.g. a daily low-stock digest
8. Users, security and workflow
• Role-based access: admin, warehouse manager, picker, receiver, driver, client, auditor
• Approval workflows for large adjustments, write-offs and transfers
• Audit log: who changed what and when
• Notifications: email, in-app, WhatsApp and SMS (WhatsApp is especially relevant in Nigeria)
• Multi-tenancy if this becomes SaaS, with data isolation per company
9. Integrations and tooling
• Barcode and QR scanning: phone cameras first, Bluetooth scanners later
• Label printing: Zebra-compatible or plain PDF labels
• Public REST API and webhooks so clients can sync their own systems
• Import tools: bulk upload of items and opening stock via CSV
• Accounting and e-commerce connectors later (Shopify, WooCommerce, Zoho, QuickBooks)
• Payment gateways: Paystack and Flutterwave for client billing
10. Nigeria-specific considerations
• Offline-first mobile or PWA: warehouses and loading bays often have unreliable internet; queue actions locally and sync later (Angular service worker plus IndexedDB)
• Low-data usage: lean payloads and pagination
• Power-cut resilience: autosave drafts
• Landmark-based addresses and multiple pick-up and drop-off points, not just street names
• Cash-on-delivery tracking and remittance reconciliation for drivers, a major local pain point
• Naira pricing with frequent changes: bulk price editing and price history
11. Nice-to-haves (later)
• AI-assisted reorder suggestions and anomaly detection (e.g. unusual shrinkage)
• Slotting optimisation: put fast movers closest to dispatch
• A customer portal where clients see their stock levels and shipment.

Suggested build order
Build the single-warehouse ledger first, then layer on locations, shipment links, billing and finally multi-client features.
1. MVP: item master, single-warehouse stock ledger, receive and dispatch, adjustments, low-stock alerts, basic dashboard, roles
2. V2: multi-warehouse and locations, transfers, batch/expiry, barcode scanning, dispatch linked to shipments and tracking, PODs
3. V3: invoicing for storage and handling, cycle counts, returns, offline mode, reports
4. V4: multi-client 3PL, API and webhooks, forecasting, integrations
Key design decision: the movements ledger
Make the stock movements ledger the single source of truth, and treat quantity on hand as a computed or cached value. Audits, valuation, transfers, returns and reports all become easier once every change is a movement record, and retrofitting this later is painful.
Suggested next steps: a PostgreSQL/Prisma schema for the ledger, an Angular module and folder structure, or a screen-by-screen UI breakdown.