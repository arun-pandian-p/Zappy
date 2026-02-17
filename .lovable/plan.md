

# Feature Gap Analysis & Enhancement Plan

After scraping quickmenu.ai and analyzing the PRD against the current QR Dine Pro codebase, here is a gap analysis and implementation plan for **missing features and enhancements only**. No existing features will be removed or degraded.

---

## Gap Analysis Summary

| PRD Feature | Current Status | Action |
|---|---|---|
| QR ordering + table mapping | Done | -- |
| Menu browsing + categories | Done | -- |
| Image upload for menu items | Done (ImageUpload component) | -- |
| Cart + checkout + tax | Done | -- |
| Coupons/discounts | Done | -- |
| Order lifecycle (5 statuses) | Done | -- |
| KDS with real-time + sounds | Done | -- |
| POS/Billing with split pay | Done | -- |
| Waiter dashboard | Exists but uses **mock data** | **Fix: connect to live DB** |
| Customer order tracking | Done | -- |
| Feedback/reviews | Done | -- |
| Analytics/reports | Done | -- |
| QR management | Done | -- |
| User roles + permissions | Done | -- |
| Super Admin panel | Done | -- |
| **Variants engine** | **Missing** | **Add** |
| **Add-ons engine** | **Missing** | **Add** |
| **Order cancel with reason** | **Missing** | **Add** |
| **Menu item edit (inline)** | **Missing** (only add/delete) | **Add** |
| **Inventory/stock tracking** | **Missing** | **Add (basic)** |
| **Customer special instructions per item** | Partial (order-level only) | **Enhance** |

---

## Implementation Plan (5 Phases)

### Phase 1: Variants & Add-ons System (Database + Admin + Customer)

**Database migration** -- Create 4 new tables:

- `variant_groups` (id, menu_item_id, name, is_required, min_select, max_select, display_order)
- `variant_options` (id, variant_group_id, name, price_modifier, is_available, display_order)
- `addon_groups` (id, restaurant_id, name, min_select, max_select, display_order)
- `addon_options` (id, addon_group_id, name, price, is_available, display_order)
- Add `addon_group_ids` (text array) column to `menu_items` for linking
- Add `selected_variants` and `selected_addons` JSONB columns to `order_items`

**Admin UI** -- New component `VariantAddonManager.tsx`:
- Inline variant group editor on the menu item form
- Add variant options with price modifiers (e.g., Size: Small +0, Medium +30, Large +60)
- Addon group manager (e.g., "Extra Toppings" with options like Cheese +20)

**Customer UI** -- New component `ItemCustomizationSheet.tsx`:
- Bottom sheet triggered when customer taps "Add" on an item with variants/addons
- Shows variant groups as radio/checkbox selections
- Shows addon groups as multi-select checkboxes
- Updates price dynamically
- Special instructions text field per item

**Cart store update** -- Extend cart item type to include selectedVariants, selectedAddons, and specialInstructions.

**Files created:**
- `src/components/admin/VariantAddonManager.tsx`
- `src/components/menu/ItemCustomizationSheet.tsx`
- `src/hooks/useVariants.ts`
- `src/hooks/useAddons.ts`

**Files modified:**
- `src/stores/cartStore.ts` (extend CartItem type)
- `src/pages/AdminDashboard.tsx` (add variant/addon UI to menu tab)
- `src/pages/CustomerMenu.tsx` (open customization sheet before adding)
- `src/components/menu/FoodCard.tsx` (show "Customizable" badge)
- `src/pages/KitchenDashboard.tsx` (display selected variants/addons in order card)
- `src/pages/BillingCounter.tsx` (show variants/addons in item summary)

---

### Phase 2: Menu Item Edit & Order Cancel with Reason

**Menu item inline editing:**
- New `EditMenuItemDialog.tsx` component -- dialog with all fields (name, price, description, category, image, vegetarian, variants)
- Add "Edit" button to each menu item card in admin dashboard
- Uses existing `useMenuItems` hook with a new `useUpdateMenuItem` mutation

**Order cancel with reason:**
- Add `cancel_reason` and `cancelled_at` columns to `orders` table
- New `CancelOrderDialog.tsx` component with predefined reasons (Out of stock, Customer request, Kitchen issue, Other) + free text
- Add Cancel button to KDS pending/preparing orders
- Notify customer side via realtime status change

**Files created:**
- `src/components/admin/EditMenuItemDialog.tsx`
- `src/components/admin/CancelOrderDialog.tsx`

**Files modified:**
- `src/hooks/useMenuItems.ts` (add updateMenuItem mutation)
- `src/hooks/useOrders.ts` (add cancelOrder mutation)
- `src/pages/AdminDashboard.tsx` (add edit button)
- `src/pages/KitchenDashboard.tsx` (add cancel button + dialog)
- `src/pages/CustomerMenu.tsx` (show cancel reason if order cancelled)

---

### Phase 3: Waiter Dashboard -- Connect to Live Data

The current `WaiterDashboard.tsx` uses **hardcoded mock data** (`mockTables`, `mockOrders`, `mockWaiterCalls`). This needs to be connected to the live database.

**Changes to `src/pages/WaiterDashboard.tsx`:**
- Replace all mock data imports with live hooks (`useTables`, `useOrders`, `usePendingWaiterCalls`, `useRespondToWaiterCall`)
- Add restaurant ID resolution (same pattern as KitchenDashboard)
- Add real-time subscriptions for order + waiter call updates
- Add sound alerts for new waiter calls
- Add "Take Order" action -- navigate to customer menu in staff mode

---

### Phase 4: Basic Inventory & Stock Management

**Database migration:**
- `inventory_items` table (id, restaurant_id, name, unit, current_stock, low_stock_threshold, updated_at)
- `recipe_mappings` table (id, menu_item_id, inventory_item_id, quantity_used)

**Admin UI** -- New tab "Inventory" in AdminDashboard:
- `InventoryManager.tsx` component
- Table view of inventory items with stock levels
- Color-coded low stock warnings (red/yellow/green)
- Manual stock adjustment (add/subtract with reason)
- Recipe linking -- map menu items to inventory ingredients
- Auto-deduction logic: when order moves to "preparing", deduct mapped quantities

**Files created:**
- `src/components/admin/InventoryManager.tsx`
- `src/hooks/useInventory.ts`

**Files modified:**
- `src/pages/AdminDashboard.tsx` (add Inventory tab)
- `src/components/admin/AdminSidebar.tsx` (add Inventory nav item)

---

### Phase 5: Enhanced Billing POS (Keyboard Shortcuts + Item Search)

Inspired by the reference POS image (image-63), enhance the BillingCounter:

- **Keyboard shortcuts**: F1 (search items), F2 (change qty), F8 (additional charges), F9 (bill discount), Ctrl+P (print), Ctrl+M (other payments)
- **Item search bar** at the top of billing -- search and add items directly to a new order (for walk-in/counter orders without QR)
- **Change to Return** calculation -- show change amount when cash received exceeds total
- **"New Bill" button** -- create orders directly from the POS for counter sales

**Files modified:**
- `src/pages/BillingCounter.tsx` (add keyboard shortcuts, item search, change calculation)

---

## Technical Summary

| Phase | New Tables | New Files | Modified Files |
|---|---|---|---|
| 1 - Variants/Addons | 4 tables + 3 columns | 4 files | 6 files |
| 2 - Edit/Cancel | 2 columns | 2 files | 5 files |
| 3 - Waiter Live | 0 | 0 | 1 file |
| 4 - Inventory | 2 tables | 2 files | 2 files |
| 5 - POS Enhance | 0 | 0 | 1 file |

**No existing features are removed.** All changes are additive enhancements.

