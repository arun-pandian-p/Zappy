# Phase 1 — Database Audit (initial)

Table | In migrations | Referenced in code
---|---:|:---
restaurants | YES | src/pages/AdminOnboarding.tsx, src/components/superadmin/AdminAccountsTable.tsx
profiles | NO (use `auth.users` / `staff_profiles`) | referenced via auth, `staff_profiles` exists
orders | YES | src/hooks, src/pages
order_items | YES | src/hooks, src/pages
menu_items | YES | src/components, src/hooks
categories | YES | src/pages/AdminOnboarding.tsx
tables | YES | src/pages/SuperAdminDashboard.tsx
qr_codes | YES | src/hooks/useQRCodes.ts, supabase/functions/qr-redirect
inventory_items | YES | src/hooks/useInventory.ts
enterprise_reviews | YES | src/components/admin/ReputationManager.tsx
users (auth.users) | auth schema / managed by Supabase | auth usage in migrations references `auth.users`
billing / invoices | invoices table exists (YES) | src/hooks/usePrinter.ts, billing flows
scan_analytics | YES | src/pages/QRRedirect.tsx
user_roles | YES | supabase/migrations and src/components/admin
subscription_plans | YES | src/hooks/useSubscriptionPlans.ts
invoices | YES | migrations/20260204054640_* and billing functions
printer_queue | YES | src/hooks/usePrinter.ts
notification_subscriptions | YES | src/hooks/usePushNotifications.ts
review_recoveries | YES | src/components/admin/ReputationManager.tsx
review_ai_insights | YES | src/components/admin/ReputationManager.tsx
recipe_mappings | YES | src/hooks/useInventory.ts
offers | YES | src/hooks/useEnterprisePromotions.ts
campaign_events | YES | src/services/analyticsService.ts
customer_events | YES | src/hooks/useCustomerEvents.ts
promotion_analytics | YES | migration
enterprise_promotions | YES | src/components/superadmin/PromotionsOverview.tsx
qr_scan_logs | YES | migrations
qr_templates | YES | migrations
food_pairings | YES | migrations
mv_restaurant_ratings (view) | YES in migrations but may be missing in runtime | referenced by ReputationManager

Notes:
- This is an initial file-based audit combining code references and migrations.
- Next step: connect to production/staging DB to validate actual runtime presence and detect orphan/foreign key violations.
