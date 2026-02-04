
# Admin Dashboard UI Redesign

## Overview

Recreate the Admin Dashboard with a modern, Pinterest-inspired design matching the reference image. The new design features a persistent sidebar navigation, glassmorphism cards with icons, a refined stat display with colored icons, a recent orders table, a menu items preview section with images, and an integrated QR code generator.

## Design Analysis from Reference Image

**Key Visual Elements:**
- Left sidebar with logo, navigation items (Dashboard, Menu, Tables & QR, Settings), user profile at bottom, and logout button
- Header with restaurant name, subtitle, search icon, settings icon, and user icon
- Horizontal tab navigation below header (Dashboard, Menu, Tables & QR, Settings)
- 3 stat cards in a row with icons (Today's Revenue, Orders Today, Active Tables)
- Recent Orders table with Table No, Items, Status badges, and Amount
- Right panel showing menu items with images, descriptions, prices, and Add buttons
- QR Code section with download button
- Color scheme: Deep blue sidebar, white cards, orange/yellow icons for stats

## Implementation Approach

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/AdminSidebar.tsx` | Persistent sidebar with navigation, user profile, logout |
| `src/components/admin/AdminHeader.tsx` | Top header with search, settings icons |
| `src/components/admin/StatCard.tsx` | Reusable stat card with icon, value, label |
| `src/components/admin/RecentOrdersTable.tsx` | Recent orders table component |
| `src/components/admin/MenuPreviewCard.tsx` | Menu item card with image and add button |
| `src/components/admin/QuickQRSection.tsx` | Quick access QR code generator |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AdminDashboard.tsx` | Complete rewrite with new layout using SidebarProvider |
| `src/index.css` | Add new utility classes and color variables |

## Detailed Component Structure

### 1. AdminSidebar Component
- **Logo section**: QR Dine Pro with gear icon, "Admin Dashboard" subtitle
- **Navigation items**: 
  - Dashboard (with home/dashboard icon) - highlighted when active
  - Menu (with bell/food icon)
  - Tables & QR (with grid icon)
  - Settings (with gear icon)
- **Bottom section**: User avatar, name, email, Logout button
- **Styling**: Dark blue/slate background, rounded active states, hover effects

### 2. AdminHeader Component  
- Restaurant name with subtitle "Manage your restaurant"
- Right side icons: Search, Settings, User profile
- Clean white background with subtle shadow

### 3. Stat Cards (3 cards in row)
- **Today's Revenue**: Yellow/orange wallet icon, ₹0 value
- **Orders Today**: Blue restaurant/chef icon, number value
- **Active Tables**: Yellow/orange utensils icon, number value
- Each card: White background, rounded corners, icon on right side

### 4. Recent Orders Table
- Table header: Table No., Items, Status, Amount
- Rows with:
  - Table icon + table number (e.g., T1)
  - Arrow + item count/names (e.g., 1x Classic Burger)
  - Status badge (Preparing = blue, Delivered = green, Pending = yellow)
  - Amount in currency
- "View All Orders" link at bottom

### 5. Menu Preview Section
- Grid of menu item cards
- Each card: Image, Veg badge (if applicable), Name, Description, Price, "+Add" button
- Green accent for vegetarian items

### 6. QR Code Section
- Shows QR code for selected table
- "Today's Revenue" and "Orders Today" quick stats below
- "Download QR Code" button

## Layout Structure

```text
+------------------+----------------------------------------+
|                  |  [Header with icons]                   |
|    SIDEBAR       +----------------------------------------+
|                  |  [Tab Navigation]                      |
|  - Dashboard     +----------------------------------------+
|  - Menu          |                                        |
|  - Tables & QR   |  [3 Stat Cards in Row]                 |
|  - Settings      |                                        |
|                  +--------------------+-------------------+
|                  |                    |                   |
|  [User Profile]  | Recent Orders      | Menu Items        |
|  [Logout]        | Table              | with Images       |
|                  |                    |                   |
+------------------+--------------------+-------------------+
```

## Color Scheme (from reference)

- **Sidebar background**: `hsl(222, 47%, 11%)` - Deep slate blue
- **Active nav item**: `hsl(217, 91%, 60%)` - Primary blue with rounded pill shape
- **Stat card icons**: 
  - Revenue: Orange/yellow `#F59E0B`
  - Orders: Blue `#3B82F6`
  - Tables: Orange/yellow `#F59E0B`
- **Status badges**:
  - Preparing: Blue background
  - Delivered: Green background
  - Pending: Yellow/amber background

## Animation & Interactions

- Framer Motion for:
  - Page transitions
  - Card hover effects (subtle scale)
  - Tab switching animations
  - Sidebar item hover states
- Smooth transitions on stat card hover
- Staggered animation for menu items loading

## Technical Implementation

### Phase 1: Create Base Components
1. Create `AdminSidebar.tsx` with SidebarProvider integration
2. Create `AdminHeader.tsx` with search and icon buttons
3. Create `StatCard.tsx` with icon, value, and label props

### Phase 2: Create Content Components
4. Create `RecentOrdersTable.tsx` with status badges
5. Create `MenuPreviewCard.tsx` with image and action button
6. Create `QuickQRSection.tsx` with QR generation

### Phase 3: Rebuild AdminDashboard
7. Rewrite `AdminDashboard.tsx` with:
   - SidebarProvider wrapper
   - New layout grid system
   - Integration of all new components
   - Framer Motion animations

### Phase 4: Styling Updates
8. Update `index.css` with new utility classes
9. Add icon color utilities
10. Add status badge variants

## Dependencies

- Existing: `framer-motion`, `lucide-react`, `qrcode.react`
- Using: Shadcn Sidebar, Card, Badge, Button, Tabs, Avatar components
- No new packages required

## Expected Outcome

A polished admin dashboard matching the reference image with:
- Professional sidebar navigation
- Clean stat cards with colorful icons
- Recent orders table with status badges
- Menu item preview cards
- Integrated QR code generator
- Smooth Framer Motion animations
- Responsive design for tablet and desktop
