<div align="center">

<img src="https://img.shields.io/badge/-🍽️-FF5722?style=for-the-badge" height="60"/>

# Zappy

### A real-time, multi-tenant restaurant operating system
**QR ordering • Dynamic promotions • AI-driven food pairing • Live kitchen ops — all in one platform.**

<br/>

![Multi-Tenant](https://img.shields.io/badge/⚡_MULTI--TENANT-000000?style=for-the-badge)
![SaaS Platform](https://img.shields.io/badge/SAAS_PLATFORM-FF5722?style=for-the-badge)
![Status](https://img.shields.io/badge/STATUS-ACTIVE-2EA44F?style=for-the-badge)


<br/>

![Stars](https://img.shields.io/github/stars/shadow-byte-warrior/Zappy?style=flat-square&logo=github&label=Stars&color=yellow)
![Forks](https://img.shields.io/github/forks/shadow-byte-warrior/Zappy?style=flat-square&logo=github&label=Forks&color=blue)
![PRs](https://img.shields.io/github/issues-pr/shadow-byte-warrior/Zappy?style=flat-square&logo=git&label=Pull%20Requests)
![Issues](https://img.shields.io/github/issues/shadow-byte-warrior/Zappy?style=flat-square&logo=github&label=Issues&color=orange)
![Contributors](https://img.shields.io/github/contributors/shadow-byte-warrior/Zappy?style=flat-square&logo=github&label=Contributors&color=brightgreen)
![License](https://img.shields.io/github/license/shadow-byte-warrior/Zappy?style=flat-square&label=License&color=lightgrey)

</div>
<img width="1907" height="836" alt="image" src="https://github.com/user-attachments/assets/3fafd302-92b9-4e9e-b3fd-26b23c088450" />
<img width="1907" height="883" alt="image" src="https://github.com/user-attachments/assets/328d9686-e76d-465c-8a9b-0c901a59dfdd" />
<img width="1910" height="863" alt="image" src="https://github.com/user-attachments/assets/ee765190-9ec0-4c0b-8ab8-0a6844513958" />
<br/>

## 📋 Table of Contents

- [✨ Overview](#-overview)
- [🚀 Key Features](#-key-features)
- [🧰 Tech Stack](#-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [🧭 Module Map](#-module-map)
- [📁 Project Structure](#-project-structure)
- [⚙️ Getting Started](#️-getting-started)
- [🔄 Development Workflow](#-development-workflow)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

<br/>

## ✨ Overview

**Zappy** is a multi-tenant restaurant operating system built for the full dine-in lifecycle — from a customer scanning a QR code at the table, to the order hitting the kitchen display in real time, to the bill printing at the counter, all the way up to platform-wide controls for super admins managing every tenant restaurant.

<br/>

## 🚀 Key Features

| | Feature | Description |
|---|---|---|
| 🛎️ | **QR Ordering** | Customers scan, browse, and order directly from their table — no app required |
| 🍳 | **Live Kitchen Display** | Real-time order pipeline synced via WebSockets, zero manual refresh |
| 💳 | **Integrated Billing** | POS-style billing counter with receipt printing (Bluetooth/USB) |
| 🧠 | **AI Food Pairing** | Smart pairing and upsell suggestions powered by a food relationship graph |
| 🏷️ | **Dynamic Promotions** | Configurable, real-time promotional rules per tenant |
| 🏢 | **True Multi-Tenancy** | Isolated branding, menus, and data per restaurant from one codebase |
| 🛠️ | **Super Admin Console** | Platform-wide visibility and control across every tenant |

<br/>

## 🧰 Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Frontend**

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=flat-square&logo=radixui&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-FFB300?style=flat-square)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=reacthookform&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white)

</td>
<td valign="top" width="50%">

**Backend & Database**

![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Supabase Auth](https://img.shields.io/badge/Supabase_Auth-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Supabase Storage](https://img.shields.io/badge/Supabase_Storage-3FCF8E?style=flat-square&logo=supabase&logoColor=white)

**Tooling**

![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Testing Library](https://img.shields.io/badge/Testing_Library-E33332?style=flat-square&logo=testinglibrary&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</td>
</tr>
</table>

<br/>

## 🏗️ Architecture

```mermaid
flowchart LR
    A[👤 Customer / Staff UI] --> B[⚛️ React State / Zustand Store]
    B --> C[🔄 React Query]
    C --> D[(🟢 Supabase Client)]
    D --> E[🐘 PostgreSQL + RLS]
    E -. real-time .-> F[🍳 Kitchen Display]
    E -. real-time .-> G[📊 Admin Dashboard]
    H[🧩 Prisma Schema] --- E
```

1. **Client Interaction** — user interacts with a module (Customer Menu, POS, Admin Dashboard).
2. **State Management** — local state updates via React state or Zustand stores.
3. **API Requests** — React Query fetches/mutates data through the Supabase client or serverless endpoints.
4. **Database Operations** — Prisma defines the schema; Supabase handles PostgreSQL operations and Row Level Security (RLS).
5. **Real-time Updates** — Supabase real-time subscriptions push live updates (e.g., new orders appearing on the KDS).

<br/>

## 🧭 Module Map

| Module | Path | What it does |
|---|---|---|
| 🛎️ **Customer Menu** | `src/pages/customer-menu/` | Customer-facing digital menu & QR ordering flow |
| 🍳 **Kitchen Display** | `src/pages/kitchen-display/` | Real-time KDS for the order pipeline |
| 💳 **Billing Counter** | `src/pages/billing-counter/` | POS / billing counter interface |
| 📊 **Admin Dashboard** | `src/pages/admin-dashboard/` | Restaurant admin: sales, menus, users |
| 🛠️ **Super Admin** | `src/pages/super-admin/` | Platform-wide controls across tenants |
| 🌐 **Landing** | `src/pages/landing/` | Marketing landing pages |
| 🔐 **Auth** | `src/pages/auth/` | Login, reset password, auth flows |

<br/>

## 📁 Project Structure

<details>
<summary><b>Click to expand full file tree</b></summary>

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

</details>

<br/>

## ⚙️ Getting Started

### Prerequisites
![Node.js](https://img.shields.io/badge/Node.js_18+-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![Supabase Account](https://img.shields.io/badge/Supabase_Account-3FCF8E?style=flat-square&logo=supabase&logoColor=white)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/shadow-byte-warrior/Zappy.git
cd Zappy

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
```

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
# 4. Start the development server
npm run dev
```

<br/>

## 🔄 Development Workflow

<details>
<summary><b>1. Database Schema & Prisma Sync</b></summary>
<br/>

- Define models and relationships in `prisma/schema.prisma`
- Generate the Prisma client: `npx prisma generate`
- Push schema changes to Supabase PostgreSQL via Prisma migrations or `db push`
- Configure Supabase RLS policies and auth settings (dashboard or migrations)

</details>

<details>
<summary><b>2. UI / Component Development</b></summary>
<br/>

- Build components inside the relevant `src/pages` module, or `src/shared` for global components
- Use Shadcn UI primitives for accessibility and consistent styling
- Apply Tailwind CSS for responsive, premium aesthetics (dark mode, glassmorphism, animation)

</details>

<details>
<summary><b>3. State & Data Integration</b></summary>
<br/>

- Use React Query for async data fetching and caching
- Use Zustand for complex state that needs to be globally accessible
- Write custom hooks (`useOrders`, `useInventory`, etc.) to abstract data logic from the UI

</details>

<details>
<summary><b>4. Testing & Polish</b></summary>
<br/>

- Write and run unit tests with Vitest: `npm run test`
- Test critical flows (Order Pipeline, QR Session lifecycle)
- Verify cross-device compatibility, especially mobile for the Customer Menu

</details>

<details>
<summary><b>5. Deployment</b></summary>
<br/>

- Verify the production build locally: `npm run build` (or `npm run build:dev`)
- Push to the repository
- Deploy the frontend to Vercel/Netlify (`vercel.json`)
- Confirm the production Supabase environment is synced and edge functions deployed

</details>

<br/>

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please see the [Code of Conduct](CODE_OF_CONDUCT.md) and [Contributing Guide](CONTRIBUTING.md) before submitting.

<br/>

## 📄 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

<br/>

<div align="center">

**Built with ❤️ for restaurants everywhere**

![Made with React](https://img.shields.io/badge/Made_with-React-61DAFB?style=flat-square&logo=react&logoColor=black)

</div>
