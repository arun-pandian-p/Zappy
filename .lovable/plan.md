

# Fix: QR Code Not Redirecting to Order Page

## Root Cause

The QR codes encode the wrong URL. Two bugs:

1. **Wrong route path**: QR generates `/menu?table=T1` but the actual React Router route is `/order` (there is no `/menu` route)
2. **Missing restaurant ID**: `CustomerMenu.tsx` reads `searchParams.get('r')` for the restaurant ID, but the QR URL never includes the `r` parameter. Without it, the page shows "Invalid QR Code"

Current QR URL format:
```text
https://qr-pal-maker.lovable.app/menu?table=T1
```

Required QR URL format:
```text
https://qr-pal-maker.lovable.app/order?r={restaurant_uuid}&table=T1
```

---

## Fix Locations

### 1. `src/components/admin/QuickQRSection.tsx` (Dashboard sidebar QR)

Line building the QR value currently:
```text
`${baseUrl}/menu?table=${selectedTable.table_number}`
```

Change to include `/order` route and `r` param:
```text
`${baseUrl}/order?r=${restaurantId}&table=${selectedTable.table_number}`
```

This requires adding a `restaurantId` prop to the component.

### 2. `src/pages/AdminDashboard.tsx` (Tables tab QR generator)

Two places generate QR values (lines 742 and 752), both using:
```text
`${qrBaseUrl}/menu?table=${selectedTable.table_number}`
```

Change both to:
```text
`${qrBaseUrl}/order?r=${restaurantId}&table=${selectedTable.table_number}`
```

Also pass `restaurantId` to the `QuickQRSection` component.

---

## Files to Modify

1. **`src/components/admin/QuickQRSection.tsx`**
   - Add `restaurantId` prop to the interface
   - Update QR value from `/menu?table=` to `/order?r={restaurantId}&table=`

2. **`src/pages/AdminDashboard.tsx`**
   - Pass `restaurantId` prop to `QuickQRSection`
   - Fix QR value in the Tables tab (2 occurrences) from `/menu` to `/order?r={restaurantId}`

---

## Technical Details

### QuickQRSection changes

Add `restaurantId: string` to the props interface. Update the `qrValue` computation:

```text
Before: `${baseUrl}/menu?table=${selectedTable.table_number}`
After:  `${baseUrl}/order?r=${restaurantId}&table=${selectedTable.table_number}`
```

### AdminDashboard changes

Pass restaurantId to QuickQRSection:
```text
<QuickQRSection ... restaurantId={restaurantId} />
```

Fix two QR value strings in the Tables tab (QRCodeSVG and QRCodeCanvas):
```text
Before: `${qrBaseUrl}/menu?table=${selectedTable.table_number}`
After:  `${qrBaseUrl}/order?r=${restaurantId}&table=${selectedTable.table_number}`
```

After these changes, scanning the QR will correctly open `/order?r=<uuid>&table=T1`, which matches the React Router route and provides both required query parameters for the CustomerMenu page to load the restaurant's menu.

