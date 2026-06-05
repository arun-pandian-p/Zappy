# 🍽️ Zappy: Multi-Tenant Restaurant Operating System

Zappy is an enterprise-grade multi-tenant B2B SaaS platform that digitizes the entire restaurant dining experience. It features real-time QR ordering, dynamic promotion engines, data-driven food graphs, automated reputation management, and real-time kitchen display dashboards.

---

## 🔑 System User Credentials

The following seeded accounts are configured in the database schema for authentication and platform testing. 

> [!NOTE]
> For security, all credentials belong to distinct roles. The system enforces multi-tenant row-level isolation so that restaurant admins can only read and write data belonging to their respective tenants.

| Email | Password | Role | Assigned Tenant / Scope |
|---|---|---|---|
| **zappyscan@gmail.com** | *Set in Dashboard* | `super_admin` | Global Platform Control |
| **spicegarden@zappy.ind.in** | `arun4709s` | `restaurant_admin` | Spice Garden (Indian Cuisine) |
| **urbanfork@zappy.ind.in** | `arun4709s` | `restaurant_admin` | Urban Fork (Continental/Fusion) |
| **admin123@gmail.com** | `admin123` | `restaurant_admin` | Zappy Demo Restaurant |

---

## 🚦 End-to-End Application Workflow

Zappy synchronizes five distinct operating flows in real time via WebSockets and PostgreSQL triggers:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Customer
    actor Kitchen as 👨‍🍳 Kitchen (KDS)
    actor Waiter as 💁‍♂️ Waiter
    actor Admin as 📊 Admin Panel

    Customer->>Admin: Scans Table QR Code
    Admin-->>Customer: Loads branding & menu (Table verified active)
    Customer->>Customer: Adds item & reviews smart recommendations
    Customer->>Admin: Places Order (math processed with active promotions)
    Admin-->>Kitchen: WebSocket broadcast of new order
    Kitchen->>Kitchen: Marks order as "Preparing" (Client notified)
    Kitchen->>Kitchen: Marks order as "Ready"
    Kitchen-->>Waiter: Pling Sound Notification
    Waiter->>Customer: Serves food at table
    Waiter->>Admin: Marks order as "Served"
    Admin-->>Customer: Triggers sessionStorage-guarded feedback prompt
    Customer->>Admin: Submits review (positive -> Google redirect; negative -> apology coupon)
    Waiter->>Customer: Processes payment at billing counter
    Waiter->>Admin: Marks order as "Completed / Paid"
```

### 1. 📱 Customer Ordering Flow
1. **QR Scan & Verification:** Customer scans the QR code at the table, navigating to `/order?r=RESTAURANT_ID&table=TABLE_NUMBER`. The system verifies the table exists and is active.
2. **Menu Browsing:** The menu loads with the restaurant's custom branding, theme colors, and cover banner.
3. **Cart Pricing Math:** Customer adds items to the cart. The promotion engine dynamically calculates BOGO deals, item-specific discounts, and percentages, then enforces minimum spend limits.
4. **Food Graph Upsells:** Based on the ingredients and types of items in the cart, the recommendation engine suggests pairings (e.g., a sweet beverage if a spicy main course is added).
5. **Checkout:** Order is placed and order items are inserted into the database.

### 2. 👨‍🍳 Kitchen Display System (KDS) Flow
1. **WebSocket Trigger:** The kitchen display immediately receives the order.
2. **Status Transitions:** Kitchen staff change status from `pending` to `preparing` (highlighting active prep timers) and then to `ready`.
3. **SLA Monitoring:** If an order exceeds 20 minutes in prep, it flashes red.

### 3. 💁‍♂️ Waitstaff & Billing Counter Flow
1. **Waiter Call:** Customers can press "Call Waiter" from their phones, which dispatches a notification to staff.
2. **Serving:** The waiter serves the food and marks it as `served`.
3. **Billing:** When checkout is requested, the system computes subtotals, tax rates (GST), and service charges, then outputs a print-ready invoice. The transaction is finalized as `completed / paid`.

### 4. 📊 Restaurant Admin Dashboard
* **Menu Manager:** Configure categories, items, variant selections, and prices. Supports upload of banners and category cover thumbnails.
* **QR Generator:** Generate table-specific dynamic tracking QR codes, downloadable at `1200px` print-resolution.
* **Reputation Center:** Proactive AI damage control. Satisfied customers are redirected to Google Reviews, while unhappy customers receive unique discount coupons generated server-side.

### 5. 👑 Superadmin Command Center
* **Tenant Management:** Oversee subscription tiers (Free, Pro, Enterprise) and onboarding progress.
* **Global Ads:** Create campaigns that insert promotional banners into target menus.
* **Platform Analytics:** Review global revenue graphs and tenant metrics.

---

## 📂 Core Folder Structure

```
Zappy/
├── .env.example          # Environment onboarding configurations
├── Dockerfile            # Multi-stage production building file
├── nginx/
│   └── nginx.conf        # Secure reverse proxy with strict headers
├── src/
│   ├── components/
│   │   ├── admin/       # Restaurant administration tools (Reputation, Settings)
│   │   ├── menu/        # Customer menu items, cart drawer, promotions
│   │   └── order/       # Ordering states and PostOrderReviewPrompt.tsx
│   ├── hooks/            # TanStack queries for ads, orders, tables, and settings
│   ├── pages/            # Core views: AdminDashboard, SuperAdmin, CustomerMenu
│   ├── services/
│   │   ├── promotions/  # Discount resolution and tax engine
│   │   ├── recommendations/ # Database food pairings scoring algorithm
│   │   └── reviews/     # Sentiment categorization and recovery coupons
│   └── utils/
│       ├── sanitize.ts   # Client-side input HTML sanitization
│       └── url.ts        # App origin URL utility resolver
└── supabase/
    ├── config.toml       # Functions edge config
    └── migrations/       # Production migration SQL schemas
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
* **Node.js:** v18+ or v20+
* **Package Manager:** npm

### Installation
1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/shadow-byte-warrior/Zappy.git
   cd Zappy
   ```
2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your Supabase keys, Unsplash secrets, and VITE_APP_URL
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the development server:
```bash
npm run dev
```

### Production Build & Hardening
To compile a minimized, optimized production bundle:
```bash
npm run build
```

---
*Built to transform restaurants into data-driven operating engines.*
