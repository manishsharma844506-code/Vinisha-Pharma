# Vinisha Pharma — UI/UX Design System & Aesthetics

## 1. Aesthetic Identity & Domain Rules
Vinisha Pharma embraces a clean, modern, professional healthcare aesthetic suitable for high-standard retail pharmacies. It rejects generic templates and enforces the **Frontend Design Constitution**:
- **Zero-Pill Discipline**: Metadata (category, strength, batch number, dates) uses unboxed text separated with subtle mid-dots (`·`) or slashes. No pill sandwiches on cards or labels.
- **Top Bar Contract**: Single brand wordmark, clean functional section links, and high-priority action button (Dual Display / Quick Sale).
- **Tabular Numerals**: Every monetary figure (₹ INR), tax percentage, quantity, barcode, and timestamp strictly uses tabular monospace figures (`font-mono tabular-nums`).
- **Color Harmony (60-30-10 Rule)**:
  - 60% Clean Neutral Canvas: Light slate (`#F8FAFC` / `bg-slate-50`).
  - 30% Structural Surfaces: Crisp white cards (`#FFFFFF`) with subtle border hairline (`border-slate-200/80`).
  - 10% Healthcare Primary Accent: Teal / Emerald (`#0D9488` / `#059669`) for primary actions, active states, and positive indicators.
  - Semantic Status:
    - Amber/Orange (`#D97706` / `#EA580C`): Near-expiry (<60d), low stock (< threshold).
    - Crimson (`#DC2626`): Expired batch, out of stock, critical alert.
    - Blue/Indigo (`#2563EB`): Rx prescription required, information.

## 2. Workstation vs. Patient Display Separation
### Display 1: Pharmacist Workstation
- Designed for speed, keyboard shortcuts, dense information readability.
- Rapid search bar with immediate autofill.
- Batch dropdown with FEFO tags (closest expiry highlighted).
- Hotkeys: `F2` New Bill, `F4` Medicine Search, `Esc` Clear, `Enter` Add to Cart.

### Display 2: Patient Facing Screen
- High-contrast, clean typography, patient-friendly presentation.
- Shows what matters to the customer: Medicine name, form, quantity, price, discount, grand total, and clear savings.
- Confidential staff data (purchase cost, margin, supplier) is 100% hidden.
- Smooth transitions between Idle (welcome & pharmacy hours), Billing (live itemized list), Payment (UPI QR with exact amount), and Success (green verified check & order receipt).

## 3. Responsive Breakpoints
- Workstation: Optimized for Desktop 1440px / 1080p and POS touchscreen terminals (1024px+).
- Patient Display: Landscape full-screen presentation (16:9 / 4:3) with large readable type for viewing at 1.5 to 2 meters distance.
