

# Fix QR System: Redirect, Dynamic Table Binding, Auto-Sync, and QA Tests

## Bugs Found

Three critical bugs prevent the QR system from working end-to-end:

1. **Edge function ignores query params**: The `qr-redirect` function extracts QR ID from the URL path first (`pathParts[pathParts.length - 1]`), which yields `"qr-redirect"` when using `?id=...`. Since `"qr-redirect"` is truthy, the `||` never reaches `url.searchParams.get("id")`. Then the `=== "qr-redirect"` check returns a 400 error. The fix: check query params first.

2. **Redirect uses relative URLs**: The `target_url` stored in `qr_codes` is a relative path like `/order?r=...`. The HTTP 302 `Location` header requires an absolute URL, so browsers either fail or redirect to the edge function domain. The fix: prepend the published app URL in the redirect function.

3. **Order placement fails after table picker**: `handlePlaceOrder` validates `!tableId`, but `tableId` comes from the original URL search param, which is empty when the user selected a table via the picker. The state `dynamicTableId` has the correct value but isn't used in validation. The fix: use `dynamicTableId` instead of `tableId`.

4. **Redundant broken update**: Lines 104-108 in qr-redirect attempt `update({ scan_count: undefined })` which does nothing or errors. The RPC call on line 111 already handles this correctly. Remove the dead code.

---

## Plan

### 1. Fix `qr-redirect` edge function

- Prioritize `url.searchParams.get("id")` over path extraction
- Resolve relative `target_url` to absolute URL using the published app base URL
- Remove the redundant `scan_count` update (keep only the RPC call)

### 2. Fix `CustomerMenu.tsx` order validation

- Change `handlePlaceOrder` to check `dynamicTableId` instead of `tableId` (which is only the initial URL param)

### 3. Fix `QRCodeManager.tsx` published URL

- Update the `PUBLISHED_URL` constant from the incorrect `qr-pal-maker.lovable.app` to the actual published URL `qr-restaurant.lovable.app`

### 4. Add QA tests for the QR redirect edge function

Create `supabase/functions/qr-redirect/index.test.ts` covering:
- Valid QR ID via `?id=...` query param returns 302 redirect
- Missing ID returns 400
- Invalid/nonexistent ID returns 404
- Rate limiting returns 429 after excessive requests

### 5. Add frontend test for TablePickerDialog

Create `src/components/menu/__tests__/TablePickerDialog.test.tsx` covering:
- Renders table buttons for active tables
- Calls `onSelectTable` with correct table number on click
- Shows empty state when no tables are available

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/qr-redirect/index.ts` | Fix ID extraction order; resolve relative URLs to absolute; remove dead scan_count update |
| `src/pages/CustomerMenu.tsx` | Use `dynamicTableId` in order validation instead of `tableId` |
| `src/components/admin/QRCodeManager.tsx` | Fix `PUBLISHED_URL` constant |

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/qr-redirect/index.test.ts` | Edge function QA tests |
| `src/components/menu/__tests__/TablePickerDialog.test.tsx` | Frontend component test |

### Edge Function Fix Detail

```text
Before (broken):
  qrId = pathParts.last || searchParams.get("id")
  --> "qr-redirect" || "actual-uuid" --> "qr-redirect" --> 400 error

After (fixed):
  qrId = searchParams.get("id") || pathParts.last
  --> "actual-uuid" || "qr-redirect" --> "actual-uuid" --> works
```

### Redirect URL Fix

```text
Before: Location: /order?r=abc&table=T1  (relative -- broken)
After:  Location: https://qr-restaurant.lovable.app/order?r=abc&table=T1  (absolute -- works)
```

### Order Validation Fix

```text
Before: if (!tableId || ...) -- tableId is from URL param only, empty after picker
After:  if (!dynamicTableId || ...) -- dynamicTableId has the picker selection
```

