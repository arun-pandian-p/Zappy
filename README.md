<div align="center">

# 🍽️ Zappy

![Multi-Tenant](https://img.shields.io/badge/⚡_MULTI--TENANT-000000?style=for-the-badge)
![SaaS Platform](https://img.shields.io/badge/SAAS_PLATFORM-FF5722?style=for-the-badge)

![realtime](https://img.shields.io/badge/🔄_realtime-WebSockets-2196F3?style=flat-square)
![AI](https://img.shields.io/badge/🧠_AI-Food%20Graph-9C27B0?style=flat-square)
![Built for](https://img.shields.io/badge/🍽️_Built%20for-Restaurants-4CAF50?style=flat-square)
![Issues](https://img.shields.io/badge/💬_Issues-Welcome-FFC107?style=flat-square)

### *A real-time, multi-tenant restaurant operating system — QR ordering, dynamic promotions, AI-driven food pairing, and live kitchen ops in one platform.*

![Stars](https://img.shields.io/github/stars/shadow-byte-warrior/Zappy?style=flat-square&label=Stars)
![Forks](https://img.shields.io/github/forks/shadow-byte-warrior/Zappy?style=flat-square&label=Forks)
![PRs](https://img.shields.io/github/issues-pr/shadow-byte-warrior/Zappy?style=flat-square&label=pull%20requests)
![Issues](https://img.shields.io/github/issues/shadow-byte-warrior/Zappy?style=flat-square&label=issues)
![Contributors](https://img.shields.io/github/contributors/shadow-byte-warrior/Zappy?style=flat-square&label=contributors)
![License](https://img.shields.io/github/license/shadow-byte-warrior/Zappy?style=flat-square&label=license)

</div>

---

## 🧭 Explore by module

| Module | Path | What it does |
|---|---|---|
| 🛎️ Customer Menu | `src/pages/customer-menu/` | Customer-facing digital menu & QR ordering flow |
| 🍳 Kitchen Display | `src/pages/kitchen-display/` | Real-time KDS for order pipeline |
| 💳 Billing Counter | `src/pages/billing-counter/` | POS / billing counter interface |
| 📊 Admin Dashboard | `src/pages/admin-dashboard/` | Restaurant admin: sales, menus, users |
| 🛠️ Super Admin | `src/pages/super-admin/` | Platform-wide controls across tenants |
| 🌐 Landing | `src/pages/landing/` | Marketing landing pages |
| 🔐 Auth | `src/pages/auth/` | Login, reset password, auth flows |

---

## 1. Tech Stack Overview

### Frontend
- **Framework**: React 18 (Vite)
- **Language**: TypeScript (`.tsx` and `.ts`)
- **Styling**: Tailwind CSS (`tailwind.config.ts`)
- **UI Components**: Shadcn UI (Radix UI primitives like Accordion, Dialog, Dropdown, etc.), Framer Motion for animations
- **State Management**: Zustand (Global state), React Query (Server state caching)
- **Forms**: React Hook Form + Zod for validation
- **Routing**: React Router DOM (`react-router-dom`)

### Backend & Database
- **BaaS (Backend as a Service)**: Supabase
  - **Database**: PostgreSQL (managed by Supabase)
  - **ORM**: Prisma (`prisma/schema.prisma` for strongly typed database access)
  - **Authentication**: Supabase Auth
  - **Storage**: Supabase Storage for assets (food images, restaurant logos)
  - **Client**: `@supabase/supabase-js`

### Tooling
- **Linting & Formatting**: ESLint
- **Testing**: Vitest (`vitest.config.ts`), React Testing Library

---

## 2. Architecture

### Key File Structure
```text
Zappy/
├── prisma/                 # Prisma ORM schema and configuration
│   └── schema.prisma       # Database schema definition
├── public/                 # Static assets (images, samples, icons)
├── scripts/                # Utility scripts for data manipulation/testing
├── src/                    # Main source code directory
│   ├── app/                # Application setup and entry points (App.tsx, main.tsx)
│   ├── assets/             # Local images and branding assets
│   ├── contexts/           # React context providers (TenantBrandingContext, etc.)
│   ├── generated/          # Generated Prisma client and models
│   ├── lib/                # Utility functions and printer logic (Bluetooth/USB)
│   ├── pages/              # Main route components and modules
│   │   ├── admin-dashboard/# Restaurant Admin interface (Sales, Menus, Users)
│   │   ├── auth/           # Authentication flows (Login, Reset Password)
│   │   ├── billing-counter/# POS/Billing Counter interface
│   │   ├── customer-menu/  # Customer facing digital menu & QR ordering
│   │   ├── kitchen-display/# Kitchen Display System (KDS)
│   │   ├── landing/        # Marketing landing pages
│   │   └── super-admin/    # Platform-wide super admin controls
│   ├── shared/             # Shared components and utilities
│   ├── stores/             # Zustand state management stores
│   ├── test/               # Test setup and utilities
│   └── utils/              # Helper functions
├── supabase/               # Supabase edge functions and migrations
├── docker-compose.yml      # Local services orchestration
├── package.json            # Project dependencies and scripts
├── tailwind.config.ts      # Tailwind configuration
├── vite.config.ts          # Vite configuration
└── README.md               # Architecture and workflow guide
```

### Data Flow
1. **Client Interaction**: User interacts with a specific module (e.g., Customer Menu, POS, Admin Dashboard).
2. **State Management**: Local state is updated via React state or Zustand stores.
3. **API Requests**: React Query or standard hooks fetch/mutate data via the Supabase client or serverless endpoints.
4. **Database Operations**: Prisma schema maps backend data structures, while Supabase handles actual PostgreSQL operations and Row Level Security (RLS).
5. **Real-time Updates**: Supabase real-time subscriptions push live updates (e.g., new orders appearing on the Kitchen Display System).

---

## 3. End-to-End Development Workflow Steps

### Step 1: Environment Setup
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Set up `.env` from `.env.example`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server using `npm run dev`.

### Step 2: Database Schema & Prisma Sync
1. Define models and relationships in `prisma/schema.prisma`.
2. Generate Prisma client using `npx prisma generate`.
3. Push schema changes to Supabase PostgreSQL using Prisma migrations or db push.
4. Configure Supabase RLS policies and authentication settings in the dashboard or via migrations.

### Step 3: UI/Component Development
1. Build React components in the respective `src/pages` module or `src/shared` for global components.
2. Use Shadcn UI primitives to ensure accessibility and consistent styling.
3. Apply Tailwind CSS for responsive and premium aesthetic designs (dark mode, glassmorphism, animations).

### Step 4: State & Data Integration
1. Use React Query for asynchronous data fetching and caching.
2. Use Zustand for complex UI state that needs to be accessed globally.
3. Write custom hooks (e.g., `useOrders`, `useInventory`) to abstract data logic from UI components.

### Step 5: Testing and Polish
1. Write and run unit tests using Vitest (`npm run test`).
2. Test critical workflows specific to Zappy (e.g., Order Pipeline, QR Session lifecycle).
3. Ensure cross-device compatibility (especially mobile optimization for the Customer Menu).

### Step 6: Deployment
1. Verify production build locally using `npm run build:dev` or `npm run build`.
2. Push code to the repository.
3. Deploy frontend to Vercel/Netlify (configured via `vercel.json`).
4. Ensure production Supabase environment is properly synced and edge functions are deployed.
