

# Sync QR Manager with Table QR System

## Problem

The app currently has two disconnected QR systems:

1. **Tables & QR tab** -- generates per-table QR codes with direct URLs like `/order?r={id}&table=T1`, but these are NOT stored in the `qr_codes` database table, so they have no scan tracking or management.
2. **QR Manager tab** -- uses the `qr_codes` table for full CRUD and analytics, but has no concept of tables.

The PDR requires a unified system where:
- The restaurant has a **single base QR URL** (same QR for the restaurant)
- Table selection happens **dynamically** (via URL param or a table picker UI after scanning)
- All QR scans are tracked in `scan_analytics`

---

## Solution: Unified QR System

### 1. Merge "Tables & QR" into "QR Manager"

Remove the separate "Tables & QR" tab. Move table CRUD (add/delete/list) into the QR Manager tab as a sub-section. The QR Manager becomes the single source of truth for all QR codes.

### 2. Auto-Generate Table QR Codes

When a table is created, automatically create a corresponding entry in the `qr_codes` table with:
- `qr_name`: "Table {number}"
- `target_url`: `/order?r={restaurantId}&table={tableNumber}`
- `qr_type`: "dynamic" (so scans go through the redirect function and get tracked)
- `metadata`: `{ table_id: "{uuid}", table_number: "{number}" }`

When a table is deleted, deactivate its corresponding QR code.

### 3. Restaurant Base QR Code

Add a "Restaurant QR" -- a single QR code that points to the restaurant menu WITHOUT a table parameter. When scanned:
- The customer lands on `/order?r={restaurantId}` (already works in preview mode)
- A table picker UI appears asking "Select your table" before ordering

This satisfies the PDR requirement: **Same QR, dynamic table selection**.

### 4. Table Picker on Customer Menu

Update `CustomerMenu.tsx` so when a customer arrives via QR without a `table` param:
- Show a table selection dialog (not just preview mode)
- Once selected, bind the table to the session
- The customer can then place orders normally

### 5. Update QR Manager UI

The QR Manager tab will show:
- **Restaurant Base QR** card at the top (single QR for the whole restaurant)
- **Table QR Codes** section showing auto-generated QR codes per table (linked to tables)
- **Custom QR Codes** section for any manually created QR codes (campaigns, etc.)
- Table management (add/delete) integrated as a sub-section
- Scan analytics below everything (already there)

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AdminDashboard.tsx` | Remove "Tables & QR" tab, merge table CRUD into QR Manager tab. Remove `tables` from mainTabs array. Pass `tables` data to QRCodeManager. |
| `src/components/admin/QRCodeManager.tsx` | Add table management section (add/delete tables). Add "Restaurant Base QR" card. Show table-linked QR codes separately from custom ones. Auto-create QR codes when tables are added. |
| `src/components/admin/AdminSidebar.tsx` | Remove "Tables & QR" nav item (keep QR Manager). |
| `src/pages/CustomerMenu.tsx` | Replace "preview mode" with a table picker dialog when no table param is present. Bind selected table to session. |
| `src/hooks/useQRCodes.ts` | Add a helper to find/create a QR code for a given table. |

### Files to Remove (no longer needed separately)

| File | Reason |
|------|--------|
| `src/components/admin/QuickQRSection.tsx` | Functionality merged into QRCodeManager |

### Auto-Sync Logic

When admin creates a table:
1. Insert into `tables` table (existing)
2. Insert into `qr_codes` table with `metadata.table_id` and dynamic type
3. QR Manager auto-refreshes to show the new table QR

When admin deletes a table:
1. Delete from `tables` table (existing)
2. Soft-delete (deactivate) the matching `qr_codes` entry

### Customer Table Picker Flow

```text
QR Scan --> /order?r={restaurantId}
  |
  +--> Has table param? --> Yes --> Bind table, show menu
  |
  +--> No table param? --> Show table picker dialog
                            |
                            +--> Customer selects table
                            |
                            +--> Update URL to include table param
                            |
                            +--> Show menu with table bound
```

### QR URL Patterns

| QR Type | URL Pattern | Behavior |
|---------|-------------|----------|
| Restaurant Base | `{redirect}/qr-id` --> `/order?r={id}` | Table picker shown |
| Table-Specific | `{redirect}/qr-id` --> `/order?r={id}&table=T1` | Direct to menu |
| Custom Campaign | `{redirect}/qr-id` --> any URL | Direct redirect |

All dynamic QR codes route through the `qr-redirect` edge function for scan tracking.

### Implementation Order

1. Update `QRCodeManager.tsx` -- add table management + auto-sync + base QR
2. Update `AdminDashboard.tsx` -- remove Tables & QR tab, pass tables to QR Manager
3. Update `AdminSidebar.tsx` -- remove Tables & QR nav item
4. Update `CustomerMenu.tsx` -- add table picker dialog
5. Update `useQRCodes.ts` -- add table QR helper
6. Remove `QuickQRSection.tsx` (dead code)

