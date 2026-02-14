

# Extend POS Billing with Sync API, Split Payments, and Enhanced Analytics

## Current State

The BillingCounter already implements most of the requested features:
- Order cards with table badges, customer metadata, item summaries, and time-ago timestamps
- Table filter badges with order counts
- Invoice preview with quantity chips, metadata badges, discount buttons, and calculation engine
- Expandable history rows with full itemized breakdowns
- Analytics tab with revenue, invoice count, average value, and payment method breakdown
- Thermal receipt printing (ESC/POS via Bluetooth/USB) with kitchen order support
- Dynamic pay button showing amount and payment method

## What Needs to Be Added

### 1. Push Invoice Edge Function (ERPNext Sync API)

Create a new edge function `push-invoice` that accepts invoice data and forwards it to an external ERPNext instance. This enables the `Lovable QR SaaS -> ERPNext Backend -> POS Awesome` architecture described in the spec.

**File**: `supabase/functions/push-invoice/index.ts`

- Accepts POST with invoice payload (table_no, customer, phone, items, discount)
- Validates the request and checks auth
- Stores the sync attempt in a new `invoice_sync_log` table for audit
- Forwards data to an ERPNext endpoint (URL configurable via secret `ERPNEXT_URL`)
- Returns success/failure status

### 2. Invoice Sync Log Table

New database table `invoice_sync_log` to track sync attempts:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| invoice_id | uuid | FK to invoices |
| restaurant_id | uuid | |
| payload | jsonb | What was sent |
| status | text | pending/success/failed |
| response | jsonb | ERPNext response |
| error_message | text | |
| created_at | timestamptz | |

RLS: Restaurant staff can view their own sync logs.

### 3. Split Payment Support

Add split payment capability to the billing flow. A customer can pay part cash, part UPI, part card.

**Changes to `BillingCounter.tsx`**:
- Add a "Split" payment method option alongside Cash/UPI/Card
- When "Split" is selected, show a split payment panel with amount fields for each method
- Validate that split amounts sum to the total
- Store split details in invoice `notes` field as structured text

**New component**: `src/components/billing/SplitPaymentPanel.tsx`
- Three input fields (Cash, UPI, Card) with remaining amount calculation
- Real-time validation showing remaining balance
- Auto-fill button to assign remaining to a method

### 4. Auto-Refresh Revenue Stats

Add a 60-second polling interval to the header revenue stat and analytics tab.

**Changes to `BillingCounter.tsx`**:
- Add `refetchInterval: 60000` to the `useInvoiceStats` and `useTodayInvoices` query options
- Add a subtle pulse animation on the revenue badge when it updates

### 5. Enhanced Analytics - Discount Tracking

Add a "Discount Given" stat card to both the History and Analytics tabs.

**Changes to `useInvoices.ts`**:
- Extend `useInvoiceStats` to also compute `totalDiscount` from `SUM(discount_amount)`

**Changes to `BillingCounter.tsx`**:
- Add a 4th stat card in History tab showing total discount given today
- Add Wallet as a 4th payment method option (stored as `wallet` in payment_method)

### 6. Kitchen Ticket Auto-Print on Order Accept

When an order transitions to "preparing", automatically trigger a kitchen ticket print if a printer is connected.

**Changes to `KitchenDashboard.tsx`**:
- After `startPreparing` succeeds, call `printKitchenOrder` from `usePrinter` if connected
- Show a toast confirming the KOT was printed

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/push-invoice/index.ts` | Edge function for ERPNext sync |
| `src/components/billing/SplitPaymentPanel.tsx` | Split payment UI component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/BillingCounter.tsx` | Add split payment mode, wallet payment, auto-refresh, discount stat card |
| `src/hooks/useInvoices.ts` | Add `totalDiscount` to stats, add `refetchInterval` support |
| `src/pages/KitchenDashboard.tsx` | Auto-print KOT on order accept |
| `supabase/config.toml` | Add `push-invoice` function config with `verify_jwt = false` |

### Database Migration

```sql
CREATE TABLE invoice_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  response jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant staff can view sync logs"
  ON invoice_sync_log FOR SELECT
  USING (restaurant_id = get_user_restaurant_id(auth.uid()));

CREATE POLICY "Restaurant staff can insert sync logs"
  ON invoice_sync_log FOR INSERT
  WITH CHECK (restaurant_id = get_user_restaurant_id(auth.uid()));
```

### Push Invoice Edge Function Payload

```json
{
  "invoice_id": "uuid",
  "table_no": "12",
  "customer": "Arun",
  "phone": "9xxxxxxx21",
  "items": [
    { "item_code": "FR", "qty": 2, "rate": 120, "name": "Fried Rice" }
  ],
  "subtotal": 420,
  "tax": 42,
  "service_charge": 21,
  "discount": 10,
  "total": 473,
  "payment_method": "upi"
}
```

### Split Payment Data Model

When split payment is used, the invoice `payment_method` is set to `"split"` and the `notes` field stores the breakdown:

```
Split: Cash ₹500 + UPI ₹420 + Card ₹500
```

### Secret Required

The `push-invoice` edge function needs an `ERPNEXT_URL` secret to know where to forward invoices. This will be requested from the user before deploying the function. If not configured, the sync simply logs the attempt locally without forwarding.

