

## Problem
The "How was your experience?" rating popup auto-appears when an order status changes to "served", which is intrusive. The user wants it to only show when manually triggered (e.g., via the "Rate Your Experience" button on served order cards).

## Plan

### 1. Remove auto-trigger logic in `src/pages/CustomerMenu.tsx`
- Remove the `useEffect` block (lines 318-341) that watches `customerOrders` for `served` status and auto-sets `reviewOrderId`
- Keep the manual trigger on the "Rate Your Experience" button (line 888) intact

### 2. Keep everything else unchanged
- The `PostOrderReviewPrompt` component, `StarRating`, feedback hooks, and Google review redirect logic all remain as-is
- The button on served order cards (`onClick={() => { setReviewImmediate(true); setReviewOrderId(order.id); }}`) continues to work for manual triggering

This is a single-file change removing ~23 lines of auto-trigger code.

