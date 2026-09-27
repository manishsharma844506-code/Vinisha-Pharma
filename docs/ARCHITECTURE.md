# Vinisha Pharma — System Architecture

## 1. Overview
Vinisha Pharma is a dual-screen, high-performance retail pharmacy management system designed for physical pharmacy retail stores in India and globally.

The system is architected around two synchronized display environments:
1. **Pharmacist / Staff Workstation (`/` or `/pharmacist`)**: Fast, keyboard-first, high-density dashboard for sales, POS, inventory, batch FEFO control, purchase management, suppliers, returns, reporting, and AI operations assistance.
2. **Customer / Patient Display (`/patient-display` or toggle in dual mode)**: High-trust, clean customer-facing display showing live cart items, taxes, discounts, grand total, QR/payment status, health awareness tips, and order confirmation. Sensitive staff information (purchase cost, margins, supplier data, admin settings) is strictly isolated and never exposed.

```
       ┌────────────────────────────────────────────────────────┐
       │               Pharmacist Workstation                   │
       │   - POS & Billing (FEFO batch selector, barcode scan)  │
       │   - Inventory & Stock Management                       │
       │   - Suppliers, Purchases, Expiry alerts, Reports       │
       │   - Gemini-powered Operations AI Assistant             │
       └──────────────┬─────────────────────────┬───────────────┘
                      │                         │
          Local BroadcastChannel        Express Backend &
         (zero-latency tab sync)        SSE / REST APIs
                      │                         │
                      ▼                         ▼
       ┌────────────────────────────────────────────────────────┐
       │             Patient / Customer Display                 │
       │   - Live transparent cart & bill breakdown             │
       │   - Real-time total, discount & savings highlight      │
       │   - UPI Dynamic QR Code & payment state indicator      │
       │   - Polished Idle, Billing, Payment, and Success states│
       └────────────────────────────────────────────────────────┘
```

## 2. Real-Time Synchronization Protocol
To guarantee 100% reliability in both multi-monitor single-machine setups and networked customer displays:
- **BroadcastChannel API (`vinisha_display_channel`)**: Provides sub-5ms local synchronization across browser windows/monitors on the same client.
- **Server Sync & State API (`/api/display/session`)**: Server-authoritative state store with Server-Sent Events (SSE) `/api/display/events` for networked tablets or wireless displays.
- **Storage Reconciliation**: Fallback to `localStorage` event-listener for cross-tab persistence across reloads.
- **Data Isolation Filter**: The payload dispatched to the patient display strips out purchase prices, cost margins, internal batch purchase IDs, supplier names, and internal notes.

## 3. Technology Stack
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Motion (animations), Lucide React (icons).
- **Backend / API**: Express 4 mounted via tsx, `@google/genai` modern SDK for pharmacy operational intelligence.
- **Data Persistence**: In-memory + file-backed JSON store with relational schema, ACID-like transaction locks for stock deduction/FEFO adjustments, and initial demo dataset.
- **Typography & Aesthetics**: Plus Jakarta Sans for UI clarity, JetBrains Mono with tabular figures (`tabular-nums`) for currency, pricing, and barcodes. Teal/Emerald healthcare palette (`#0D9488` / `#059669`) with dark slate neutrals (`#0F172A`).

## 4. Key Subsystems
1. **POS / Billing Engine**: Fast keyboard navigation, barcode scanner support, FEFO batch prioritization, customizable tax/GST, round-off, multi-mode payment (Cash, UPI, Card, Split), printable thermal/A4 tax invoice.
2. **Batch & Inventory Management**: Multi-batch tracking with expiry tracking, purchase vs MRP vs selling price, minimum stock thresholds, auto-classification (expired, <30d, <60d, <90d).
3. **Purchases & Suppliers**: Inward stock workflow with automatic batch creation, supplier ledger, and purchase invoices.
4. **Returns Engine**: Customer returns with stock restoration & supplier purchase returns with debit tracking.
5. **AI Pharmacy Assistant**: Operations assistant built with `@google/genai` (gemini-3.8-flash). Supports read-only querying of stock, sales trends, fast-moving items, reorder suggestions, and financial summaries. Restricted from diagnosing or prescribing.
