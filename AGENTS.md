## Higgsfield Skills

Load skills from:

- .codex/skills/higgsfield
- .cursor/skills/higgsfield
- .opencode/skills/higgsfield
- .agents/skills/higgsfield

Available:
- higgsfield-generate
- higgsfield-product-photoshoot
- higgsfield-marketplace-cards
- higgsfield-soul-id
## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
## Zappy - Premium Restaurant OS

### Mission
Transform Zappy into a premium restaurant OS with unified UX across landing, customer, admin, and super admin.

### Phases
- **P0** — Functional Fixes: Notifications, Orders, QR Session, Search
- **P1** — UI Refactor: Customer premium mobile, Landing revamp
- **P2** — Design System: Dark luxury theme (emerald+gold, glassmorphism, motion)
- **P3** — Performance: 404 assets, dead routes, bundle size, images

### P0 Progress
| Item | Status | Details |
|------|--------|---------|
| Notifications | ✅ Done | Gutted `NotificationCenter.tsx` sheet; bell in `CustomerTopBar.tsx` now routes to `notifications` view; removed push notification toggle (VAPID broken); removed `onNotificationClick` prop |
| Orders | ✅ Clean | `renderOrders()` already minimal — shows items, qty, price, status, timeline. No waiter/notification noise. |
| QR Seat Selection | ✅ Done | Migrated to DB-backed `seat_occupancy`. Seat 1-N derived from table capacity. |
| Search | ✅ OK | Already sticky (`sticky top-[56px]`), realtime filtering, category slider, mobile-optimized |
| Session Isolation | ✅ Done | Migrated from raw arrays to cryptographic `seat_session_id` tokens bound directly to `orders`. Complete cross-talk immunity. Added Postgres triggers for source-of-truth table statuses. |

### P1 Queue
- [ ] Higgsfield premium mobile UI (FoodCard, MenuItemRow, ItemDetailsDialog, empty/loading)
- [ ] Remove PricingSection and TrustCounters from landing
- [ ] Add product showcase, restaurant stories, interactive demo

### P2 Queue
- [ ] Design tokens (colors, typography, buttons, cards, inputs, dialogs, nav)
- [ ] Apply across landing, customer, admin, super admin

### P3 Queue
- [ ] Fix 404 assets, dead routes, duplicate components, bundle size, image optimization

### Build Status
- Build: ✅ 0 errors
- Tests: ✅ 134 pass (12 files)

### Relevant Files
- `src/pages/CustomerMenu.tsx` (1762 lines) — main customer menu, orders, search, notifications
- `src/components/menu/CustomerTopBar.tsx` — top bar with search, bell→Alerts, profile
- `src/components/menu/SeatPickerDialog.tsx` — seat selection (P0 new)
- `src/components/menu/TablePickerDialog.tsx` — table selection
- `src/components/menu/NotificationCenter.tsx` — deprecated (unused sheet)
- `src/components/menu/BottomNav.tsx` — bottom nav (Home, Search, Orders, Alerts, Profile)
- `src/hooks/useTableSessions.ts` — session lifecycle
- `src/components/admin/AdminSidebar.tsx` (347 lines) — admin sidebar
