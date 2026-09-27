# Vinisha Pharma — Development Roadmap & Implementation Plan

## Phase 0: Project Audit & Plan (Current)
- [x] Audit existing project files, framework, dependencies, and environment constraints.
- [x] Create core documentation: `ARCHITECTURE.md`, `ROADMAP.md`, `DATABASE.md`, `UI-DESIGN.md`.
- [x] Sync `metadata.json` and `index.html` with branding and healthcare typography.
- [x] Prepare unified server/client full-stack runner with Express and Vite.

## Phase 1: Foundation & Data Architecture
- [ ] Implement database models, schema types, initial seed data (OTC, antibiotics, vitamins, analgesics, batches, suppliers, customers, sales history).
- [ ] Create persistent database service with transactional batch deductions and stock updates.
- [ ] Build global application shell, navigation system, role switcher (Owner/Admin, Pharmacist, Cashier, Patient Display).
- [ ] Implement design tokens, reusable modal dialogs, search inputs, data tables, and toast notifications.

## Phase 2: Pharmacist Workstation & Dashboard
- [ ] Executive KPI tiles (Today Sales, Orders, Low Stock Items, Expiring Soon, Expired, Inventory Value).
- [ ] Interactive charts: 7-day revenue trend, top-moving medicines, category breakdown.
- [ ] Quick-action alert feed (out-of-stock items, urgent expiry batches).

## Phase 3: Inventory & FEFO Batch Management
- [ ] Complete medicine catalog with search, filter by category/form/prescription status.
- [ ] Batch tracking with FEFO (First Expiry First Out) sorting.
- [ ] Stock adjustment modal with audit reason tracking.
- [ ] Add/Edit medicine and new batch creation workflows.

## Phase 4: High-Performance Pharmacy POS
- [ ] Rapid medicine search (name, generic, brand, barcode, SKU).
- [ ] Auto-FEFO batch selection with manual batch override.
- [ ] Instant cart management with quantity controls, strip/pack sizing, unit price calculations.
- [ ] Tax / GST breakdown, discount % or flat, prescription attachment flag.
- [ ] Multi-payment support (Cash with change calculator, dynamic UPI QR generator, Card).
- [ ] Sale completion, stock auto-deduction, invoice generation.

## Phase 5: Customer-Facing Display & Real-Time Sync
- [ ] Dedicated patient display route (`/patient-display` and split-view preview in applet).
- [ ] Dual-channel real-time sync (BroadcastChannel + Server SSE fallback).
- [ ] 4 polished customer display states:
  1. **Idle**: Welcome message, operating hours, health awareness announcements.
  2. **Billing**: Real-time itemized cart, quantity, unit price, savings, subtotal, and tax.
  3. **Payment**: Payment prompt with dynamically generated UPI QR and amount.
  4. **Success**: Order confirmation, invoice summary, thank you greeting.
- [ ] Strict data isolation: purchase costs, profit margins, supplier data are never broadcast.

## Phase 6: Purchase Inwards & Supplier Management
- [ ] Supplier directory with contact info, GSTIN, balance tracking.
- [ ] Purchase invoice entry: supplier selection, invoice #, batch creation, purchase/selling/MRP rates, tax.
- [ ] Automated stock and batch quantity replenishment upon purchase completion.

## Phase 7: Customer CRM & Sales/Purchase Returns
- [ ] Patient/customer records with contact details and purchase history ledger.
- [ ] Sales return workflow with invoice lookup, item selection, return reason, refund calculation, and inventory restock.
- [ ] Supplier purchase return workflow.

## Phase 8: Reports, Analytics & Print-Ready Tax Invoices
- [ ] Reports module: Daily sales summary, Product sales, Tax summary (GST breakdown), Expiry report, Stock movement audit.
- [ ] Export functionality (CSV export, printable reports).
- [ ] Standard pharmacy tax invoice generator with thermal receipt (80mm) and standard A4 invoice layouts.

## Phase 9: AI Pharmacy Operations Assistant
- [ ] Integration with Gemini API (`gemini-3.8-flash`) via server-side proxy (`/api/ai/assistant`).
- [ ] Safe function calling / operational tools:
  - `query_inventory_stats` (check low stock, expiring batches)
  - `query_sales_summary` (revenue, top sellers, trends)
  - `suggest_reorder_list` (based on stock vs reorder level)
- [ ] Medical safety guardrails: explicitly reject diagnostic/prescriptive requests and enforce pharmacist verification.

## Phase 10: Security, Role Permissions & Audit Logging
- [ ] Role-based access control (Admin, Pharmacist, Cashier, Patient Display).
- [ ] Audit logging for all stock adjustments, returns, and configuration edits.
- [ ] Input validation and sanitization.

## Phase 11: Verification & End-to-End Testing
- [ ] Verification of all workflows (POS sale, stock deduction, batch selection, returns, customer display sync).
- [ ] Edge cases: 0 stock, negative quantities, expired batch warnings, network reconnects.

## Phase 12: Premium Polish & Final Delivery
- [ ] Refined typography, visual rhythm, micro-interactions, keyboard shortcuts (F2 POS, F4 Search, etc.).
- [ ] Zero-broken-image, zero-pill discipline, WCAG AA compliance.
