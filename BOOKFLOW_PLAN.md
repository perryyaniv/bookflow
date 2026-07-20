# BookFlow Project Plan

## Overview
BookFlow is an internal Hebrew-first RTL web app for bookstore staff to manage customer book orders across branches.

The app will be built with a stack closely aligned to the reference project in C:\Projects\CourseManager:
- Frontend: React + TypeScript + Vite + Tailwind + React Router + i18next + Socket.IO client
- Backend: Node.js + Express + TypeScript + Mongoose + MongoDB + Socket.IO + JWT + bcrypt
- Deployment: Vercel for frontend, Render for backend, MongoDB Atlas for database

## Product decisions locked

### Core product shape
- Internal staff app, not public-facing
- Hebrew RTL UI
- Admin and Clerk roles
- Orders are scoped per branch
- Admins configure branches and other business options in Settings

### Order model
- One order may contain multiple book lines
- Each book line has:
  - book name
  - SKU / catalog ID
  - quantity
- Order date defaults to local date/time and remains editable
- Ordered from is a controlled dropdown with admin-configurable options
- Payment is a simple boolean state

### Status lifecycle
- Created
- Ordered
- Arrived
- Customer Notified
- Collected
- Cancelled

### Alerting rules
- “Not Arrived” is based on the Ordered date
- “Not Collected / Cancelled” is based on the Customer Notified date
- Thresholds are configurable by admins
- Default thresholds: 14 days

### Auditing
- Record who changed what and when
- Audit log visible to admins only

### UX decisions
- Home screen is dashboard-first
- Two separate urgent panels on the home screen
- Orders page has table-first layout with card support on mobile
- Detail, create, and edit views are full pages optimized for mobile
- New Order is accessible from home and main navigation
- Orders are a dedicated navigation item
- Search and filters are primary on Orders page
- Real-time updates refresh dashboard, list, and open detail pages

---

## Recommended architecture

### Frontend structure
- src/
  - api/
  - components/
    - layout/
    - ui/
    - orders/
  - contexts/
  - hooks/
  - i18n/
  - pages/
  - types/
  - utils/
  - App.tsx
  - main.tsx
  - index.css

### Backend structure
- src/
  - index.ts
  - config/
  - middleware/
  - models/
  - routes/
  - controllers/
  - services/
  - utils/
  - socket/

---

## Backend implementation plan

### Existing scaffold
The starter scaffold currently includes:
- backend/package.json
- backend/tsconfig.json
- backend/.env.example
- backend/src/index.ts
- backend/src/middleware/auth.ts
- backend/src/models/User.ts
- backend/src/models/Branch.ts
- backend/src/models/Order.ts
- backend/src/models/AppSettings.ts
- backend/src/models/AuditLogEntry.ts
- backend/src/routes/auth.ts
- backend/src/routes/users.ts

### Next backend tasks
1. Finish route implementations for:
   - orders
   - settings
   - auditLog
2. Add controllers and services for:
   - auth
   - users
   - orders
   - settings
   - audit log
3. Add request validation and error handling
4. Add audit log creation on every meaningful order change
5. Add alert calculation helpers for the two overdue categories
6. Add seed data for:
   - admin user
   - sample branches
   - default settings

### Suggested API endpoints
#### Auth
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me
- PUT /api/auth/change-password

#### Users
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

#### Orders
- GET /api/orders
- GET /api/orders/:id
- POST /api/orders
- PUT /api/orders/:id
- PATCH /api/orders/:id/status
- DELETE /api/orders/:id

#### Settings
- GET /api/settings
- PUT /api/settings

#### Audit log
- GET /api/audit-log

---

## Frontend implementation plan

### Pages to build
- Login
- Change Password
- Dashboard
- Orders
- New Order
- Order Detail
- Edit Order
- Settings
- Audit Log
- User Management

### Core UI components
- Layout / Sidebar / Header
- Button / Input / Select / Badge / Card / Spinner
- OrderTable
- OrderCardList
- OrderForm
- StatusBadge
- AlertPanel

### Required behaviors
- RTL Hebrew layout
- Responsive table/card views
- Search and filters on Orders page
- Quick New Order action from dashboard and navigation
- Real-time refresh using Socket.IO
- Admin-only access to settings and audit log

---

## Data model draft

### User
```ts
{
  name,
  email,
  passwordHash,
  role,
  branchId,
  createdAt,
  updatedAt
}
```

### Branch
```ts
{
  name,
  isActive,
  createdAt,
  updatedAt
}
```

### Order
```ts
{
  branchId,
  customerName,
  customerPhone,
  orderDate,
  orderedFrom,
  isPaid,
  status,
  orderedAt,
  customerNotifiedAt,
  createdBy,
  updatedBy,
  items: [{ bookName, sku, quantity }],
  createdAt,
  updatedAt
}
```

### AppSettings
```ts
{
  branches,
  orderSourceOptions,
  notArrivedThresholdDays,
  notCollectedThresholdDays,
  updatedAt
}
```

### AuditLogEntry
```ts
{
  entityType,
  entityId,
  action,
  userId,
  userName,
  changedAt,
  before,
  after
}
```

---

## Suggested initial seed data

### Default roles
- admin
- clerk

### Default branches
- סניף 1
- סניף 2

### Default order source options
- מודן
- מחסן
- סניף אחר

### Default thresholds
- notArrivedThresholdDays = 14
- notCollectedThresholdDays = 14

---

## Suggested implementation order
1. Bootstrap backend and frontend shells
2. Implement auth and roles
3. Implement MongoDB models and routes
4. Implement orders CRUD
5. Add dashboard alerts
6. Add orders list/search/filter UI
7. Add detail/edit/new pages
8. Add settings and audit log
9. Add Socket.IO real-time updates

---

## Important implementation notes
- Keep the first version simple and practical
- Prefer embedded order items in the order document over a more complex normalized design
- Avoid over-engineering notifications beyond the two dashboard alert panels
- Use admin-only settings and audit log access
- Focus on a mobile-friendly, fast operational workflow

---

## Current repository status
The following starter backend files are already created:
- backend/package.json
- backend/tsconfig.json
- backend/.env.example
- backend/src/index.ts
- backend/src/middleware/auth.ts
- backend/src/models/User.ts
- backend/src/models/Branch.ts
- backend/src/models/Order.ts
- backend/src/models/AppSettings.ts
- backend/src/models/AuditLogEntry.ts
- backend/src/routes/auth.ts
- backend/src/routes/users.ts

The next agent should continue by finishing the remaining backend routes and then scaffolding the frontend structure.
