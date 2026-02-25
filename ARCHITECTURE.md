# Architecture Document - LaptopMarket RBAC System

## Overview

LaptopMarket is a laptop buy & sell marketplace built with Next.js 16 (App Router). This document describes the **Role-Based Access Control (RBAC)** architecture that secures every layer of the application — from route access down to individual database mutations.

The system was designed with three guiding principles:

1. **Defense in depth** — authorization is enforced at three independent layers
2. **Least privilege** — each role receives exactly the permissions it needs
3. **Fail closed** — when a permission check encounters an error, access is denied by default

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Full-stack React framework with server components and server actions |
| Authentication | NextAuth v5 (Auth.js) | JWT-based authentication with credential and OAuth providers |
| Database | PostgreSQL | Relational data storage for users, listings, orders |
| ORM | Prisma | Type-safe database access and schema management |
| Validation | Zod | Runtime input validation on both server and client |
| Data Fetching | TanStack Query | Client-side server state management with caching |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first CSS with accessible component primitives |
| Utilities | clsx, tailwind-merge, lucide-react, date-fns, uuid | Conditional classes, icons, date formatting, ID generation |

---

## Role Hierarchy

```
Guest (unauthenticated) → User → Seller → Admin → Super Admin
```

- **Guest**: No database record. Determined by absence of a session.
- **User**: Default role for all registered accounts. Can browse, buy, review.
- **Seller**: Lateral upgrade from User. Retains all User permissions plus product management. Requires admin-approved application.
- **Admin**: Platform moderator. Can manage users, listings, orders, and moderate content.
- **Super Admin**: Unrestricted system owner. Can manage admins, system configuration, and the RBAC structure itself.

The role is stored as a PostgreSQL enum (`Role`) directly on the `User` model. A separate roles table was intentionally avoided — the role set is small (4 stored values + Guest concept), fixed, and rarely changes.

---

## Three-Layer Authorization Architecture

### Layer 1: Middleware (Route Protection)

**File**: `src/middleware.ts`

The middleware runs at the edge before any page or API route renders. It reads the NextAuth JWT from request cookies and performs coarse route-level access control.

**What it does:**
- Maps URL patterns to minimum required roles (e.g., `/dashboard/admin/*` → Admin or Super Admin)
- Redirects unauthenticated users to `/auth/login` with a callback URL
- Redirects authenticated users with insufficient roles to `/forbidden`
- Returns 403 JSON for unauthorized API route access
- Redirects suspended users to `/suspended` and banned users to `/banned`
- Prevents authenticated users from accessing auth pages (login, register)

**What it does NOT do:**
- Fine-grained permission checks (e.g., "can this user edit THIS specific listing?")
- Database queries (edge runtime limitation — uses JWT claims only)

**Route protection rules** (checked in order, first match wins):

| Pattern | Required Roles |
|---------|---------------|
| `/dashboard/admin/*` | ADMIN, SUPER_ADMIN |
| `/api/admin/*` | ADMIN, SUPER_ADMIN |
| `/dashboard/seller/*` | SELLER, ADMIN, SUPER_ADMIN |
| `/api/seller/*` | SELLER, ADMIN, SUPER_ADMIN |
| `/dashboard/user/*` | Any authenticated |
| `/api/user/*` | Any authenticated |
| `/auth/*` | Unauthenticated only |
| Everything else | Public |

### Layer 2: Server Actions & API Routes (Source of Truth)

**Files**: `src/app/_actions/*.ts`, `src/app/api/*/route.ts`

Every data mutation and sensitive read follows the same authorization flow:

```
1. Authenticate  →  Get session via auth(). Reject 401 if absent.
2. Authorize     →  Check role + permission + ownership. Reject 403 if denied.
3. Validate      →  Parse input with Zod. Reject 400 if invalid.
4. Execute       →  Run business logic and database mutations.
5. Respond       →  Return structured success or error.
```

This is the **security boundary** — the single source of truth for authorization. Even if middleware is bypassed (e.g., direct API call), server actions re-verify every permission.

**Permission checking** uses two utility functions:
- `authorize(role, accountStatus, permission)` — checks both role permission and account status in one call
- `canAccessResource(userId, ownerId, role, ownPerm, anyPerm)` — handles ownership-scoped permissions (e.g., "edit own listing" vs "edit any listing")

### Layer 3: UI-Level Access Control (UX Only)

**Files**: `src/components/rbac/permission-gate.tsx`, `src/hooks/use-permission.ts`

Client-side components conditionally render based on the user's role. This provides a clean UX (hiding buttons users can't use) but offers **zero security** — the server always re-validates.

**Components:**
- `<PermissionGate permission="admin.accessDashboard">` — wraps content that should only be visible to users with a specific permission
- `<PermissionGate role="SELLER">` — wraps content requiring a minimum role
- `usePermission()` hook — provides `can()`, `hasRole()`, and `canAccess()` functions plus pre-built convenience checks

---

## Permission System Design

### Permission Identifiers

Permissions are flat strings organized by domain:

```
auth.register, auth.login, auth.logout, auth.resetPassword
profile.viewOwn, profile.editOwn, profile.deleteOwn, profile.viewAny, profile.editAny
listing.browse, listing.create, listing.editOwn, listing.editAny, listing.deleteOwn, ...
order.create, order.viewOwn, order.cancelOwn, order.updateStatusOwn, ...
moderation.reportContent, moderation.approveSellers, moderation.suspendUsers, ...
admin.accessDashboard, admin.manageUsers, admin.createAdmins, admin.systemConfig, ...
```

### Permission Storage

Permissions are **code-defined**, not database-stored. The role-to-permission map lives in `src/lib/rbac/permissions.ts` as a static TypeScript object. Rationale:

1. Permissions are known at build time and change infrequently
2. Changes are version-controlled via git
3. Full TypeScript type safety — invalid permission strings are caught at compile time
4. No database query needed to evaluate permissions (zero latency)

### Ownership-Scoped Permissions

Many permissions come in `*Own` / `*Any` pairs:

- `listing.editOwn` — Sellers can edit their own listings
- `listing.editAny` — Admins can edit any listing

The `canAccessResource()` utility resolves this: it checks `*Any` first (role-based), then falls back to `*Own` + ownership check (userId === resourceOwnerId).

---

## Authentication Flow

### Session Strategy

**JWT** — chosen because the middleware runs at the edge (Vercel Edge Runtime, Cloudflare Workers) where database access is not available. The JWT carries:

- `id` — user UUID
- `role` — current role enum value
- `accountStatus` — ACTIVE, SUSPENDED, or BANNED

### Token Lifecycle

1. **Sign-in**: The `signIn` callback blocks SUSPENDED and BANNED users
2. **JWT creation**: The `jwt` callback embeds `role` and `accountStatus` from the database
3. **Token refresh**: On every refresh cycle (maxAge: 5 minutes), the callback re-queries the database for current role/status
4. **Session mapping**: The `session` callback exposes JWT claims on the session object

### Forced Token Refresh (Role Change Propagation)

When an admin changes a user's role or status, a `TokenInvalidation` record is created in the database. On the next request, the system detects that the token is stale and forces a refresh with updated claims from the database.

For MVP, the short JWT `maxAge` (5 minutes) ensures role changes propagate within one refresh cycle without additional infrastructure.

---

## Database Schema Design

### Core Models

```
User
├── Account (NextAuth OAuth)
├── SellerProfile (1:1, created on seller approval)
├── SellerApplication (1:many, tracks upgrade requests)
├── Listing (1:many, seller's products)
├── Order (as buyer and as seller)
├── Review (1:many, reviews written)
├── Report (1:many, content reports filed)
├── AuditLog (1:many, admin actions performed)
└── TokenInvalidation (1:many, for forced refresh)

Listing
├── Category (many:1)
├── Brand (many:1)
├── Order (1:many)
├── Review (1:many)
└── Report (1:many)

Order
├── Buyer (User)
├── Seller (User)
├── Listing
└── ShippingAddress
```

### Enum Types

- `Role`: USER, SELLER, ADMIN, SUPER_ADMIN
- `AccountStatus`: ACTIVE, SUSPENDED, BANNED
- `ListingStatus`: ACTIVE, PAUSED, SOLD, DELETED
- `ListingCondition`: NEW, LIKE_NEW, EXCELLENT, GOOD, FAIR, POOR
- `OrderStatus`: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, REFUND_REQUESTED, REFUNDED
- `VerificationStatus`: PENDING, APPROVED, REJECTED
- `ApplicationStatus`: PENDING, APPROVED, REJECTED

### Indexing Strategy

All foreign keys are indexed. Additional indexes on:
- `User.email` (unique, lookup by email)
- `User.role` and `User.accountStatus` (filtering in admin views)
- `Listing.price` and `Listing.createdAt` (sorting in catalog)
- `Order.status` and `Order.createdAt` (order management queries)
- `AuditLog.action` and `AuditLog.createdAt` (log browsing)

---

## Edge Case Handling

### Seller Accessing Admin Routes

1. **Middleware**: JWT role is SELLER, route requires ADMIN+. Redirects to `/forbidden`
2. **API**: Server action returns 403 `{ error: "INSUFFICIENT_PERMISSIONS" }`
3. **UI**: Admin nav links never render for Seller role

### User Upgrading to Seller

1. User submits `SellerApplication` via server action (role remains USER)
2. Admin reviews and approves in admin dashboard
3. Server action atomically: updates role to SELLER, creates `SellerProfile`, creates `TokenInvalidation`, writes `AuditLog`
4. User's next token refresh picks up the new role

### Banned/Suspended Accounts

- **Suspension**: Temporary. `accountStatus` set to SUSPENDED with optional expiration. Middleware redirects to `/suspended`. All API calls return 403.
- **Ban**: Permanent. `accountStatus` set to BANNED. Listings hidden. SignIn callback rejects future logins. Middleware redirects to `/banned`.
- **Restriction**: Admins cannot suspend/ban other Admins. Super Admins cannot suspend/ban other Super Admins. Enforced in server actions.

### Mid-Session Role Changes

JWTs are stateless — a role change doesn't immediately propagate. Mitigation:
- Short JWT maxAge (5 minutes) ensures frequent refreshes
- `TokenInvalidation` records track which users have stale tokens
- Critical operations re-query the database for the latest role

---

## File Structure

```
src/
├── app/
│   ├── _actions/           # Server actions (auth, profile, listing, order, admin, etc.)
│   ├── api/                # API route handlers
│   │   ├── auth/           # NextAuth route handler
│   │   ├── listings/       # Public listing endpoints
│   │   └── admin/          # Admin API endpoints
│   ├── auth/               # Auth pages (login, register, reset)
│   ├── dashboard/
│   │   ├── user/           # User dashboard (orders, wishlist, profile)
│   │   ├── seller/         # Seller dashboard (listings, sales, analytics)
│   │   └── admin/          # Admin dashboard (users, moderation, analytics)
│   ├── banned/             # Banned account page
│   ├── suspended/          # Suspended account page
│   ├── forbidden/          # 403 error page
│   ├── layout.tsx          # Root layout with Providers
│   └── page.tsx            # Landing page
├── components/
│   ├── rbac/               # PermissionGate, RoleBadge
│   ├── layout/             # Navbar, Sidebar (role-aware)
│   └── providers.tsx       # SessionProvider + QueryClientProvider
├── hooks/
│   ├── use-current-user.ts # Typed session user
│   ├── use-permission.ts   # Permission checking for UI
│   └── use-require-role.ts # Client-side role redirect
├── lib/
│   ├── auth/auth.ts        # NextAuth configuration
│   ├── rbac/               # Roles, permissions, check functions
│   ├── validations/        # Zod schemas by domain
│   ├── db.ts               # Prisma client singleton
│   └── utils.ts            # cn() utility
├── types/
│   └── next-auth.d.ts      # NextAuth type augmentation
└── middleware.ts            # Route protection
prisma/
└── schema.prisma           # Complete database schema
```

---

## Security Principles

1. **Never trust the client.** UI permission checks are cosmetic. The server is the single source of truth.
2. **Authenticate, then authorize, then validate, then execute.** Every server action follows this exact order.
3. **Ownership is not role.** Being a Seller does not grant access to all listings — only your own.
4. **JWTs carry claims but are not gospel.** For critical operations, re-query the database.
5. **Audit everything admins do.** Every moderation action creates an immutable `AuditLog` entry.
6. **Defense in depth.** Middleware blocks routes. Server actions re-verify. UI hides elements. Three independent layers.
7. **Fail closed.** If a permission check errors, deny access by default.
8. **Least privilege.** Admins cannot manage other Admins. Only Super Admins touch system config.

---

## How to Extend

### Adding a New Role

1. Add the role to the `Role` enum in `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Add the role to `ROLE_HIERARCHY` and `ROLE_DISPLAY_NAMES` in `src/lib/rbac/types.ts`
4. Define its permissions array in `src/lib/rbac/permissions.ts`
5. Add it to the `ROLE_PERMISSIONS` map
6. Update middleware route rules if needed

### Adding a New Permission

1. Add the permission string to the `Permission` type union in `src/lib/rbac/types.ts`
2. Add it to the appropriate role arrays in `src/lib/rbac/permissions.ts`
3. Use `authorize()` or `hasPermission()` in the relevant server action
4. Optionally gate UI elements with `<PermissionGate permission="your.newPermission">`

### Adding a New Protected Route

1. Add a route rule to `PROTECTED_ROUTES` in `src/middleware.ts`
2. Create the page/API route under the appropriate directory
3. Add server-side auth checks in the page or server action
