

# Enhance Table Binding Persistence and Add Missing Test Coverage

## Current State

Most of the requested features are already implemented:
- TablePickerDialog component exists with 4 tests
- Base restaurant QR auto-creates on QR Manager load
- Table-specific QR codes auto-generate when tables are added
- qr-redirect edge function uses query params (`?id=...`) and resolves to absolute URLs
- Dynamic table selection works via the TablePickerDialog

## What's Missing

### 1. Session persistence across browser sessions

Currently, the selected table is stored only in React state + URL params. If the customer closes the browser and re-opens the link without the `table` param, they must re-select. The fix: persist the table selection in `localStorage` keyed by restaurant ID, and restore it on load.

### 2. Auto-sync for existing tables without QR entries

If tables were created before the unified QR system was added, they have no matching `qr_codes` entry. The QR Manager should detect orphaned tables and auto-create their QR codes on load.

### 3. Additional test coverage

The existing tests cover basics but miss:
- Session persistence (localStorage restore)
- Table capacity display
- Restaurant name display in dialog
- Re-selection blocked when dialog is closed

---

## Plan

### 1. Add localStorage persistence in CustomerMenu.tsx

- On `handleTableSelect`: save `{ restaurantId, tableNumber }` to `localStorage`
- On component mount: if no `table` URL param, check `localStorage` for a saved table for the current restaurant and auto-restore it
- This ensures the table binding survives page refreshes and re-visits

### 2. Auto-sync orphaned tables in QRCodeManager.tsx

- After tables and QR codes load, compare the tables list against `tableQRCodes`
- For any table that has no matching QR code (by `metadata.table_id`), auto-create a dynamic QR entry
- This handles tables created before the unified system was introduced

### 3. Expand TablePickerDialog tests

Add new test cases:
- Displays restaurant name in the welcome message
- Shows seat capacity for each table
- Does not render dialog when `open` is false

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CustomerMenu.tsx` | Add localStorage save/restore for table selection. On mount, check `localStorage` key `qr_table_{restaurantId}` and initialize `dynamicTableId` from it if URL param is absent. |
| `src/components/admin/QRCodeManager.tsx` | Add `useEffect` that compares `tables` against `tableQRCodes` and auto-creates missing QR entries for orphaned tables. |
| `src/components/menu/__tests__/TablePickerDialog.test.tsx` | Add 3 new test cases for restaurant name display, capacity display, and closed state. |

### localStorage Schema

```text
Key:   qr_table_{restaurantId}
Value: { tableNumber: "T1", timestamp: 1700000000000 }
```

Entries older than 4 hours are ignored (session expiry).

### Auto-Sync Logic

```text
On QR Manager load:
  For each table in tables[]:
    If no qrCode exists where metadata.table_id === table.id:
      Create dynamic QR code for that table
```

### New Test Cases

| Test | Assertion |
|------|-----------|
| "displays restaurant name" | `screen.getByText(/Welcome to My Restaurant/)` |
| "shows capacity per table" | `screen.getByText("4 seats")` |
| "does not render when closed" | `queryByText("Select Your Table")` returns null |

