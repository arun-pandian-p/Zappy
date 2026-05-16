# 🚀 Zappy: Enterprise Restaurant AI Operating System

Zappy is a comprehensive, multi-tenant SaaS platform that modernizes the entire restaurant lifecycle. From digital QR ordering and intelligent cart promotions to AI-driven kitchen displays and automated review recovery, Zappy provides an end-to-end ecosystem for modern food and beverage businesses.

---

## 🌟 Core Architecture & Ecosystem Overview

The application is broken down into several distinct portals and intelligence layers that synchronize in real-time via Supabase PostgreSQL and WebSockets.

### 1. 🏢 Multi-Tenant SaaS Infrastructure
*   **Superadmin Dashboard**: The central command center for Zappy operators. Manage all restaurant tenants, handle global platform analytics, approve/reject restaurant promotion campaigns, and oversee system health.
*   **Feature Gating & Subscriptions**: Tiered access (Free, Basic, Premium, Enterprise) unlocks advanced features like AI insights, custom branding, and automated exports.
*   **Global Ad Platform**: Superadmins can push platform-wide advertisements directly into the menus of participating restaurants.

### 2. 🍽️ The Customer Menu (QR Ordering System)
*   **Frictionless Ordering**: Scan a QR code to view a dynamic, visually stunning menu—no app download required.
*   **Enterprise Promotion Engine**: A robust cart logic engine that evaluates active promotions, handles multi-level discount stacking, enforces minimum order values, and prevents conflict (e.g., stopping a user from combining mutually exclusive BOGO deals with a 20% off coupon).
*   **AI Food Graph Recommendations**: Moving beyond static "upsells", Zappy uses a semantic relationship graph to analyze the user's cart in real-time. It suggests highly relevant pairings (e.g., suggesting a cooling beverage if a spicy main course is added) to maximize Average Order Value (AOV).
*   **Live Order Tracking**: Customers receive real-time UI and audio feedback as their order transitions from *Preparing* to *Ready* to *Served*.

### 3. 👨‍🍳 Staff Operations (Kitchen & Waitstaff)
*   **Kitchen Display System (KDS)**: An embedded, real-time tablet interface for kitchen staff. Orders appear instantly. Kitchen staff can mark items as *Preparing* or *Ready*, triggering WebSockets that update the customer's phone instantly.
*   **Waitstaff / Billing Counter**: Dedicated views for managing table sessions, handling cash/card transactions, finalizing invoices, and printing receipts.
*   **Table Session Timers**: Admins can monitor how long tables have been occupied to optimize turnover rates.

### 4. 🧠 Intelligence & AI Services Layer
Zappy has moved away from external heavy dependencies (like Gemini) toward a fast, localized AI architecture processing data directly within the ecosystem.

*   **Offline-First OCR Menu Importer**: Restaurant owners can upload raw PDFs or images of their old menus. The system uses robust local parsing logic to extract items, prices, and categories for instant menu generation.
*   **Automated Food Image Generation**: When managers add items without photos, Zappy uses local image generation workflows to automatically generate high-quality, delicious-looking representations of the dishes.

### 5. 🛡️ Intelligent Review & Reputation Management
The most critical retention feature is Zappy's proactive damage-control ecosystem that intercepts bad experiences before they reach public platforms (like Google Reviews).

*   **Gamified Post-Order Flow**: Exactly when the kitchen marks an order as `Served`, the customer receives a frictionless review prompt.
*   **Heuristic Sentiment Analysis**: The engine parses customer text, extracting pain points (e.g., `food_cold`, `service_slow`) and generating compound sentiment scores (-1.0 to +1.0) without relying on slow external LLMs.
*   **Automated Review Recovery**: If a customer leaves a negative review, the system automatically intervenes. Based on the severity, it issues a personalized apology and a unique discount coupon (e.g., `15% OFF`) to win them back instantly.
*   **Smart Routing**: Satisfied customers (4-5 stars) are celebrated and smoothly redirected to Google Reviews, driving the restaurant's public ranking up. Angry customers are kept internal.
*   **Reputation Center Dashboard**: Managers can view AI Insights, track resolved complaints, and monitor their overall sentiment distribution.

---

## 🛠️ Technical Stack & Frameworks

*   **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion (Micro-animations)
*   **UI Components**: Radix UI, Lucide Icons, Shadcn UI
*   **State Management & Data Fetching**: TanStack React Query (`useQuery`, `useMutation`)
*   **Backend & Database**: Supabase (PostgreSQL), Row Level Security (RLS) for absolute multi-tenant isolation, Supabase Realtime (WebSockets)
*   **Routing**: React Router v7

---

## 📂 Key Codebase Directories

*   `src/pages/`: Contains the main portal views (`AdminDashboard.tsx`, `SuperAdminDashboard.tsx`, `CustomerMenu.tsx`, `KitchenDashboard.tsx`).
*   `src/components/admin/`: Modules for the restaurant owner (Menu Manager, Promotions, Reputation Center, QR Code Generator).
*   `src/components/superadmin/`: Modules for the platform operator (Global Analytics, Tenant Management, Campaign Approvals).
*   `src/components/order/`: The core ordering UI and the highly customized `PostOrderReviewPrompt.tsx`.
*   `src/services/`: The brain of Zappy.
    *   `/promotions/cartPricingEngine.ts`: The enterprise discount resolution math.
    *   `/recommendations/foodGraph.ts`: The semantic cart upselling logic.
    *   `/reviews/sentimentAnalysisService.ts`: NLP and reputation analytics.
    *   `/reviews/recoveryEngine.ts`: Automated apology & coupon generation.

---

## 🚦 Application Workflow Summary

1.  **Onboarding**: Restaurant signs up -> Configures branding, tables, and subscription tier -> Bulk imports their menu via the OCR tool.
2.  **Dining In**: Customer scans QR code -> Views menu -> Adds items -> *CartPricingEngine* applies active valid promotions -> *FoodGraph* suggests a complementary drink -> Order is placed.
3.  **Fulfillment**: Order appears on Kitchen KDS -> Chef marks as *Preparing* -> Marks as *Ready* -> Waiter delivers and marks as *Served*.
4.  **Feedback & Retention**: Customer sees the *PostOrderReviewPrompt* -> Leaves 2 stars due to slow service -> *SentimentAnalysis* categorizes the complaint -> *RecoveryEngine* issues a 20% apology coupon instantly -> Manager gets alerted in the *Reputation Center*.
5.  **Analytics & Billing**: Customer pays at the counter -> Transaction clears -> Data flows into the Admin Dashboard's Revenue Trends & Heatmaps. Superadmin views platform-wide growth.

---
*Built to transform restaurants into data-driven powerhouses.*
