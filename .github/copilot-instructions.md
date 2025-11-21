# Copilot Instructions for RentalFlow Manager

## Repository Overview

**RentalFlow Manager** is a Next.js 15.3.3 web application for managing rental properties, tenants, invoices, and expenses. It uses Firebase for authentication and database, with AI-powered payment receipt verification via Google Genkit.

**Technology Stack:**
- **Frontend:** React 18.3.1, Next.js 15.3.3 (App Router), TypeScript 5
- **UI:** Tailwind CSS 3.4.1, Shadcn/UI components (Radix UI primitives)
- **Backend:** Firebase 11.9.1 (Auth, Firestore client & Admin SDK)
- **AI:** Genkit 1.20.0 with Google Gemini 2.5-flash
- **Runtime:** Node.js 20.19.5, npm 10.8.2
- **Size:** ~70 TypeScript/TSX files, medium-sized codebase

**Core Features:** Tenant dashboards, invoice management, payment submission with receipt upload, admin dashboard with income analytics, tenant/property management, monthly invoice generation, AI-powered payment verification, expense tracking.

## Build & Validation

### Initial Setup (ALWAYS run these first)

```bash
npm install
```

**IMPORTANT:** On first run, `npm run lint` will prompt to configure ESLint. Select "Strict (recommended)" and press Enter. This creates `.eslintrc.json` and installs ESLint dependencies (~30 seconds).

### Available Commands

**Type Checking** (30 seconds):
```bash
npm run typecheck
```
NOTE: Currently fails with 10 TypeScript errors in 5 files (see Known Issues). This is expected. The project uses `next.config.ts` with `ignoreBuildErrors: true` to allow builds despite type errors.

**Linting** (15 seconds):
```bash
npm run lint
```
NOTE: After initial ESLint setup, may show a circular structure warning but completes successfully.

**Building** (120+ seconds):
```bash
npm run build
```
NOTE: Requires valid Firebase credentials in environment variables (see Environment Setup). Without credentials, build fails during page pre-rendering with `FirebaseError: auth/invalid-api-key`.

**Development Server** (starts in 5 seconds):
```bash
npm run dev
```
Runs on port 9002 with Turbopack. Access at `http://localhost:9002`.

**Genkit AI Development** (for AI flows):
```bash
npm run genkit:dev    # Start Genkit development server
npm run genkit:watch  # Start with watch mode
```

### Environment Setup

**CRITICAL:** Firebase configuration is required but intentionally excluded from the repository (`.gitignore` ignores `src/lib/firebase/config.ts` and `.env*` files).

For local development, you need:
1. `src/lib/firebase/config.ts` - Contains Firebase client configuration object (empty by default)
2. `.env` file with `FIREBASE_SERVICE_ACCOUNT_KEY` for server-side operations

Without these, builds will fail. For code changes that don't require Firebase (e.g., UI components), you can skip the build step or use `npm run typecheck` for validation.

### Build Sequence for Validation

1. Clean previous builds: `rm -rf .next`
2. Install dependencies: `npm install`
3. Type check (optional, has known errors): `npm run typecheck`
4. Lint (set up ESLint on first run): `npm run lint`
5. Build (requires Firebase credentials): `npm run build`

**Alternative for non-Firebase changes:** Skip build and use `npm run typecheck` and `npm run lint` only.

## Project Architecture

### Directory Structure

```
rental-flow/
├── .github/              # GitHub-specific files (this file)
├── docs/                 # Documentation
│   └── blueprint.md      # App requirements and style guide
├── src/
│   ├── ai/               # Genkit AI flows
│   │   ├── dev.ts        # AI development entry point
│   │   ├── genkit.ts     # Genkit configuration
│   │   └── flows/        # AI flow definitions
│   │       └── verify-payment-receipt.ts
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx      # Root page (main app entry)
│   │   ├── layout.tsx    # Root layout
│   │   ├── actions.ts    # Server actions (Firebase Admin operations)
│   │   └── globals.css   # Global styles (Tailwind)
│   ├── components/       # React components
│   │   ├── admin/        # Admin-only views (Dashboard, Tenants, Properties, Invoices, Expenses)
│   │   ├── tenant/       # Tenant views (Dashboard, PaymentForm)
│   │   ├── auth/         # Authentication (LoginView)
│   │   ├── layout/       # Layout components (Header)
│   │   ├── shared/       # Shared components (LanguageSwitcher, RoleSwitcher)
│   │   └── ui/           # Shadcn/UI components (~25 reusable components)
│   ├── contexts/         # React contexts
│   │   ├── AppContext.tsx    # App state (role, properties, tenants, invoices, expenses)
│   │   └── AuthContext.tsx   # Authentication state
│   ├── hooks/            # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   └── lib/              # Utilities and configuration
│       ├── firebase/     # Firebase setup
│       │   ├── config.ts     # Firebase client config (GITIGNORED, empty by default)
│       │   ├── client.ts     # Firebase client initialization
│       │   ├── admin.ts      # Firebase Admin SDK initialization
│       │   └── firestore.ts  # Firestore helper functions
│       ├── types.ts      # TypeScript type definitions
│       ├── schemas.ts    # Zod validation schemas
│       ├── data.ts       # Mock data for development
│       ├── i18n.ts       # Internationalization (Spanish/English)
│       └── utils.ts      # Utility functions
├── components.json       # Shadcn/UI configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── postcss.config.mjs    # PostCSS configuration
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
├── apphosting.yaml       # Firebase App Hosting configuration
└── firestore.rules       # Firestore security rules
```

### Key Architecture Patterns

**Authentication Flow:**
- `AuthContext` manages Firebase Auth state
- `AppContext` loads user role and application data after authentication
- `page.tsx` renders `LoginView` if not authenticated, `AdminView` or `TenantView` based on role

**Data Model (see `src/lib/types.ts`):**
- `User`: Firebase Auth users with roles (`owner` or `tenant`)
- `Property`: Rental properties with owners
- `Tenant`: Tenancy records linking users to properties
- `Invoice`: Monthly invoices with payment tracking
- `Expense`: Property expenses (fixed services or maintenance)

**Server Actions (see `src/app/actions.ts`):**
All Firebase Admin operations are server actions:
- `verifyReceiptAction`: AI-powered payment receipt verification
- `createUserDocumentAction`, `createTenantAction`, `updateTenantAction`, `deleteTenantAction`
- `addPropertyAction`, `updatePropertyAction`, `deletePropertyAction`

**Firestore Collections:**
- `users`: User profiles with roles
- `properties`: Property details
- `tenants`: Tenancy agreements
- `invoices`: Monthly invoices (NOT created in actions.ts, created via InvoiceGenerator component)
- `expenses`: Property expenses (NOT in actions.ts, managed client-side)

### Configuration Files

- **ESLint:** `.eslintrc.json` (created on first `npm run lint`)
- **TypeScript:** `tsconfig.json` (uses `@/*` alias for `./src/*`)
- **Next.js:** `next.config.ts` (ignores build errors/linting, allows remote images)
- **Tailwind:** `tailwind.config.ts` (custom theme with CSS variables)
- **Shadcn/UI:** `components.json` (component aliases and configuration)
- **Firebase:** `firestore.rules` (security rules), `apphosting.yaml` (deployment config)

### Important Dependencies

- **Radix UI:** ~25 primitives for accessible components
- **React Hook Form + Zod:** Form validation
- **Lucide React:** Icon library
- **date-fns:** Date utilities
- **recharts:** Charts for admin dashboard
- **genkit-cli:** Development tool for AI flows

## Known Issues

### TypeScript Errors (10 errors in 5 files)
The codebase has intentional type errors that are ignored in builds:

1. **src/components/admin/Expenses.tsx** (3 errors): Uses `propertyId` which doesn't exist on `Property` type. Should use `id`.
2. **src/components/admin/InvoiceGenerator.tsx** (2 errors): Missing import for `doc` from Firebase.
3. **src/components/admin/Properties.tsx** (1 error): Property type mismatch with `owners` field.
4. **src/components/layout/Header.tsx** (2 errors): `useAuth()` not properly null-checked.
5. **src/lib/firebase/admin.ts** (2 errors): `firebaseConfig` is empty object, missing `projectId`.

**Workaround:** `next.config.ts` has `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` to allow builds. When fixing bugs, fix these errors first.

### Build Failures
- **Without Firebase credentials:** Fails with `FirebaseError: auth/invalid-api-key` during pre-rendering
- **Clean builds:** Always run `npm install` before building to ensure dependencies are present
- **ESLint first run:** Requires interactive prompt selection

### Gitignored Sensitive Files
- `src/lib/firebase/config.ts` (Firebase client config)
- `.env*` files (environment variables)
- These files must be created locally for development

## Validation & Testing

**No test suite exists.** Validation is manual:

1. **Type checking:** `npm run typecheck` (expect 10 errors)
2. **Linting:** `npm run lint` (may show circular structure warning)
3. **Build:** `npm run build` (requires Firebase credentials)
4. **Manual testing:** `npm run dev` and test in browser

**For code changes:**
- Non-Firebase changes: Type check and lint only
- Firebase changes: Full build required
- UI changes: Manual browser testing at `http://localhost:9002`
- AI flows: Use `npm run genkit:dev` to test in Genkit UI

## CI/CD

**No GitHub Actions workflows exist.** Deployment uses Firebase App Hosting (`apphosting.yaml`).

## Important Notes

**Trust these instructions first.** Only search the codebase if information here is incomplete or incorrect.

**When modifying code:**
- Respect existing TypeScript errors (they're intentionally ignored)
- Follow Shadcn/UI patterns for new components
- Use server actions in `src/app/actions.ts` for Firebase operations
- Maintain i18n support (Spanish/English in `lib/i18n.ts`)
- Follow Tailwind CSS custom theme (see `tailwind.config.ts`)
- Use `@/` alias for imports (maps to `src/`)

**Build optimization:**
- First lint run takes ~30 seconds (ESLint setup)
- Builds take 120+ seconds with Firebase credentials
- Use `--turbopack` flag for faster dev server (already in npm scripts)
- Clean `.next/` directory if builds behave unexpectedly

**Firebase Admin SDK:**
- Server-side operations MUST use `adminDb` and `adminAuth` from `src/lib/firebase/admin.ts`
- Client-side uses `db` and `auth` from `src/lib/firebase/client.ts`
- Never import admin SDK in client components


When performing a code review, respond in Spanish.