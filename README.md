# LaptopMarket

A secure laptop buy & sell marketplace built with Next.js 16, featuring a production-ready Role-Based Access Control (RBAC) system with five user roles, three-layer authorization enforcement, and full audit logging.

---

## Features

- **Role-Based Access Control** — Five roles (Guest, User, Seller, Admin, Super Admin) with granular permission management
- **Three-Layer Authorization** — Middleware route protection, server-side permission checks, and UI-level access gating
- **Seller Application Flow** — Users apply to become sellers; admins review and approve/reject applications
- **Account Moderation** — Suspension (temporary) and ban (permanent) flows with automatic token invalidation
- **Audit Logging** — Every admin/moderation action is recorded with actor, target, and metadata
- **JWT Authentication** — Stateless sessions with short-lived tokens for fast role change propagation
- **Type-Safe Permissions** — Compile-time permission checking via TypeScript union types
- **Input Validation** — All server actions and API routes validate input with Zod schemas

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Authentication | [NextAuth v5](https://authjs.dev/) (JWT strategy) |
| Database | [PostgreSQL](https://www.postgresql.org/) |
| ORM | [Prisma](https://www.prisma.io/) |
| Validation | [Zod](https://zod.dev/) |
| Data Fetching | [TanStack Query](https://tanstack.com/query) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Utilities | clsx, tailwind-merge, date-fns, uuid |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd admin-dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and NextAuth secret
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:1234/laptopmarket?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

---

## Project Structure

```
├── prisma/
│   └── schema.prisma            # Database schema (14 models, 7 enums)
├── src/
│   ├── app/
│   │   ├── _actions/            # Server actions by domain
│   │   │   ├── auth-actions.ts
│   │   │   ├── profile-actions.ts
│   │   │   ├── listing-actions.ts
│   │   │   ├── order-actions.ts
│   │   │   ├── review-actions.ts
│   │   │   ├── seller-actions.ts
│   │   │   ├── admin-actions.ts
│   │   │   └── super-admin-actions.ts
│   │   ├── api/                 # REST API route handlers
│   │   │   ├── auth/            # NextAuth endpoints
│   │   │   ├── listings/        # Public catalog API
│   │   │   └── admin/           # Admin-only API
│   │   ├── auth/                # Authentication pages
│   │   ├── dashboard/
│   │   │   ├── user/            # Buyer dashboard
│   │   │   ├── seller/          # Seller dashboard
│   │   │   └── admin/           # Admin dashboard
│   │   ├── banned/              # Banned account page
│   │   ├── suspended/           # Suspended account page
│   │   └── forbidden/           # 403 access denied page
│   ├── components/
│   │   ├── rbac/                # PermissionGate, RoleBadge
│   │   ├── layout/              # Navbar, Sidebar (role-aware)
│   │   └── providers.tsx        # Session + Query providers
│   ├── hooks/
│   │   ├── use-current-user.ts  # Typed session user hook
│   │   ├── use-permission.ts    # Permission checking hook
│   │   └── use-require-role.ts  # Client-side role guard
│   ├── lib/
│   │   ├── auth/auth.ts         # NextAuth configuration
│   │   ├── rbac/                # RBAC engine
│   │   │   ├── types.ts         # Role, Permission types
│   │   │   ├── roles.ts         # Role hierarchy utilities
│   │   │   ├── permissions.ts   # Role-to-permission map
│   │   │   ├── check-permission.ts  # authorize(), hasPermission()
│   │   │   └── check-ownership.ts   # canAccessResource()
│   │   ├── validations/         # Zod schemas by domain
│   │   ├── db.ts                # Prisma client singleton
│   │   └── utils.ts             # cn() utility
│   ├── types/
│   │   └── next-auth.d.ts       # NextAuth type augmentation
│   └── middleware.ts            # Route protection middleware
├── ARCHITECTURE.md              # Detailed architecture documentation
└── README.md
```

---

## RBAC System

### Roles

| Role | Level | Description |
|------|-------|-------------|
| Guest | 0 | Unauthenticated visitor. Can browse catalog and register. |
| User | 1 | Authenticated buyer. Can purchase, review, and manage orders. |
| Seller | 2 | Verified seller. Can create/manage listings and fulfill orders. |
| Admin | 3 | Platform moderator. Can manage users, listings, and moderate content. |
| Super Admin | 4 | System owner. Unrestricted access including system configuration. |

### Three-Layer Authorization

```
Request → [Middleware] → [Server Action] → [Database]
              │                │
         Route-level      Permission +
         role check       ownership check
              │                │
         Redirects or     Returns 401/403
         403 response     with error code
```

1. **Middleware** (`src/middleware.ts`) — Coarse route protection using JWT claims. No database access.
2. **Server Actions** (`src/app/_actions/`) — Fine-grained permission + ownership checks. Source of truth.
3. **UI Components** (`src/components/rbac/`) — Conditional rendering for UX. Not a security boundary.

### Permission Categories

- **Authentication** — register, login, logout, password reset
- **Profile** — view/edit own, view/edit any (admin)
- **Listings** — browse, create, edit own/any, delete own/any, analytics
- **Orders** — create, view own/all, cancel, update status, refund
- **Reviews** — create, edit own, moderate any
- **Moderation** — report content, review reports, approve sellers, suspend users
- **Admin** — dashboard access, analytics, user management, system config

### Key RBAC Files

| File | Purpose |
|------|---------|
| `src/lib/rbac/types.ts` | Permission type union, role hierarchy, display names |
| `src/lib/rbac/permissions.ts` | Static role-to-permission mapping (source of truth) |
| `src/lib/rbac/check-permission.ts` | `authorize()`, `hasPermission()`, `isAccountActive()` |
| `src/lib/rbac/check-ownership.ts` | `canAccessResource()` for own/any permission pairs |
| `src/middleware.ts` | Route-level protection with role requirements |

---

## Database Schema

The Prisma schema defines 14 models across 5 domains:

- **Auth**: User, Account, VerificationToken
- **Seller**: SellerProfile, SellerApplication
- **Product**: Listing, Category, Brand
- **Commerce**: Order, ShippingAddress, Review
- **Moderation**: Report, AuditLog, TokenInvalidation

See [ARCHITECTURE.md](ARCHITECTURE.md) for the complete schema documentation.

---

## API Reference

### Public Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/listings` | Browse listings with search/filter/pagination |
| GET | `/api/listings/[id]` | Get listing detail |

### Admin Endpoints (requires Admin/Super Admin)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/users` | List users with filters |
| GET | `/api/admin/sellers` | List seller applications |
| GET | `/api/admin/analytics` | Platform analytics |

### Server Actions

All mutations are handled via Next.js server actions in `src/app/_actions/`:

- `registerUser()`, `loginUser()` — Authentication
- `createListing()`, `updateListing()`, `deleteListing()` — Listing CRUD
- `createOrder()`, `cancelOrder()`, `updateOrderStatus()` — Order management
- `suspendUser()`, `banUser()`, `reactivateUser()` — Account moderation
- `reviewSellerApplication()` — Seller approval workflow
- `updateUserRole()` — Role management (Super Admin only)

---

## Security

- **Input Validation**: All inputs validated with Zod before processing
- **Password Hashing**: bcrypt with 12 rounds
- **JWT Sessions**: Short-lived tokens (5-minute maxAge) with database-backed refresh
- **Token Invalidation**: Role/status changes trigger forced token refresh
- **Audit Trail**: All admin actions logged with actor, target, and metadata
- **Ownership Checks**: Resource mutations verify ownership before allowing access
- **Account Moderation**: Suspended/banned accounts are blocked at middleware and server action levels
- **Role Escalation Prevention**: Admins cannot modify other Admins; Super Admins cannot modify other Super Admins

---

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## License

Private — All rights reserved.
