# InstructorStudio — Full-Stack Production Application

> **Stack:** Node.js + Express (API) · Next.js 14 (Frontend) · PostgreSQL 16 · Redis 7 · Docker

---

## 📁 Project Structure

```
instructorstudio/
├── backend/                    # Express API
│   ├── src/
│   │   ├── config/             # DB, Redis connections
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, rate-limit, validate, audit
│   │   ├── routes/             # All API routes
│   │   ├── services/           # Business logic
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # JWT, errors, logger, response
│   │   ├── validators/         # Zod schemas
│   │   ├── app.ts              # Express app setup
│   │   └── server.ts           # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Next.js 14 App Router
│   ├── src/
│   │   ├── app/                # App router pages
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── auth/           # Login, Register, Reset
│   │   │   ├── courses/        # Course catalog + detail
│   │   │   ├── blog/           # Blog listing + post
│   │   │   ├── careers/        # Jobs listing
│   │   │   ├── dashboard/      # Student dashboard
│   │   │   │   ├── page.tsx    # Overview
│   │   │   │   ├── my-courses/ # Enrolled courses
│   │   │   │   ├── certificates/
│   │   │   │   ├── profile/    # Settings
│   │   │   │   ├── blog/       # Blog manager
│   │   │   │   └── careers/    # HR manager
│   │   │   └── admin/          # Admin panel
│   │   │       ├── page.tsx    # Dashboard
│   │   │       └── users/      # User management
│   │   ├── components/
│   │   │   └── layout/         # Navbar, DashboardSidebar
│   │   ├── hooks/              # React Query hooks
│   │   ├── lib/                # API client, services, utils
│   │   ├── store/              # Zustand auth store
│   │   ├── types/              # TypeScript interfaces
│   │   └── middleware.ts       # Next.js route protection
│   ├── Dockerfile
│   └── package.json
│
├── database/
│   └── instructorstudio_db.sql # Full PostgreSQL schema
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- Node.js 20+ · PostgreSQL 16 · Redis 7 · Git

### 2. Clone & Setup

```bash
git clone https://github.com/your-org/instructorstudio.git
cd instructorstudio
```

### 3. Database Setup

```bash
createdb instructorstudiodb
psql -U postgres instructorstudiodb < database/instructorstudio_db.sql
```

### 4. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
# API: http://localhost:4000
```

### 5. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install
npm run dev
# Web: http://localhost:3000
```

---

## 🐳 Docker (Production)

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with production values

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f web
```

**Services:**
| Service  | Port | Description           |
|----------|------|-----------------------|
| postgres | 5432 | PostgreSQL database   |
| redis    | 6379 | Redis cache/sessions  |
| api      | 4000 | Express REST API      |
| web      | 3000 | Next.js frontend      |
| nginx    | 80/443 | Reverse proxy + SSL |

---

## 🔑 Default Credentials

| Role        | Email                          | Password     |
|-------------|--------------------------------|--------------|
| Super Admin | admin@instructorstudio.in      | Admin@1234   |

> ⚠️ **Change the default password immediately after first login.**

---

## 🗺️ API Reference

**Base URL:** `http://localhost:4000/api/v1`

### Auth
| Method | Endpoint                  | Auth     | Description              |
|--------|---------------------------|----------|--------------------------|
| POST   | /auth/register            | Public   | Create account           |
| GET    | /auth/verify-email        | Public   | Verify email token       |
| POST   | /auth/login               | Public   | Login → tokens           |
| POST   | /auth/refresh             | Cookie   | Refresh access token     |
| POST   | /auth/logout              | Bearer   | Revoke tokens            |
| POST   | /auth/forgot-password     | Public   | Send reset email         |
| POST   | /auth/reset-password      | Public   | Reset with token         |
| POST   | /auth/change-password     | Bearer   | Change password          |
| GET    | /auth/me                  | Bearer   | Current user info        |

### Courses
| Method | Endpoint                        | Auth       | Description           |
|--------|---------------------------------|------------|-----------------------|
| GET    | /courses                        | Optional   | List courses          |
| GET    | /courses/featured               | Public     | Featured courses      |
| GET    | /courses/categories             | Public     | All categories        |
| GET    | /courses/:slug                  | Optional   | Course detail         |
| POST   | /courses                        | Instructor | Create course         |
| PATCH  | /courses/:id                    | Owner/Admin| Update course         |
| POST   | /courses/:id/publish            | Admin      | Publish course        |
| POST   | /courses/:id/sections           | Instructor | Add section           |
| POST   | /courses/:id/lessons            | Instructor | Add lesson            |

### Enrollments
| Method | Endpoint                                    | Auth    | Description         |
|--------|---------------------------------------------|---------|---------------------|
| POST   | /enrollments                                | Student | Enroll in course    |
| GET    | /enrollments                                | Student | My enrollments      |
| PATCH  | /enrollments/:id/drop                       | Student | Drop course         |
| POST   | /enrollments/:id/lessons/:lid/progress      | Student | Update progress     |

### Payments
| Method | Endpoint                    | Auth   | Description          |
|--------|-----------------------------|--------|----------------------|
| POST   | /payments/orders            | Student| Create order         |
| POST   | /payments/verify            | Student| Verify payment       |
| GET    | /payments/orders            | Student| Order history        |
| POST   | /payments/orders/:id/refund | Admin  | Refund order         |
| POST   | /payments/webhook/razorpay  | Public | Razorpay webhook     |
| GET    | /payments/coupons           | Admin  | List coupons         |
| POST   | /payments/coupons           | Admin  | Create coupon        |

### Certificates
| Method | Endpoint                        | Auth   | Description         |
|--------|---------------------------------|--------|---------------------|
| GET    | /certificates/my                | Student| My certificates     |
| GET    | /certificates/verify/:no        | Public | Verify certificate  |

### Blog
| Method | Endpoint                          | Auth          | Description      |
|--------|-----------------------------------|---------------|------------------|
| GET    | /blog                             | Public        | List posts       |
| GET    | /blog/:slug                       | Public        | Post detail      |
| POST   | /blog                             | Blog Manager  | Create post      |
| PATCH  | /blog/:id                         | Blog Manager  | Update post      |
| DELETE | /blog/:id                         | Blog Manager  | Delete post      |
| GET    | /blog/:id/comments                | Public        | Post comments    |
| POST   | /blog/:id/comments                | Authenticated | Add comment      |
| PATCH  | /blog/comments/:id/moderate       | Blog Manager  | Moderate comment |

### Careers
| Method | Endpoint                           | Auth       | Description       |
|--------|------------------------------------|------------|-------------------|
| GET    | /careers/jobs                      | Public     | List jobs         |
| GET    | /careers/jobs/:slug                | Public     | Job detail        |
| POST   | /careers/jobs                      | HR Manager | Create job        |
| PATCH  | /careers/jobs/:id                  | HR Manager | Update job        |
| DELETE | /careers/jobs/:id                  | HR Manager | Delete job        |
| POST   | /careers/jobs/:id/apply            | Authenticated | Apply          |
| GET    | /careers/applications              | HR Manager | All applications  |
| PATCH  | /careers/applications/:id/status   | HR Manager | Update status     |

### Admin
| Method | Endpoint              | Auth  | Description         |
|--------|-----------------------|-------|---------------------|
| GET    | /admin/stats          | Admin | Platform stats      |
| GET    | /admin/activity-logs  | Admin | Audit trail         |
| GET    | /admin/enrollments    | Admin | All enrollments     |
| GET    | /users                | Admin | User list           |
| PATCH  | /users/:id/status     | Admin | Ban/activate user   |
| POST   | /users/:id/roles      | Super | Assign role         |
| DELETE | /users/:id/roles/:role| Super | Revoke role         |

### Website / CMS
| Method | Endpoint                         | Auth          | Description        |
|--------|----------------------------------|---------------|--------------------|
| GET    | /website/settings                | Public        | Site settings      |
| PATCH  | /website/settings/:key           | Web Manager   | Update setting     |
| GET    | /website/faqs                    | Public        | FAQ list           |
| GET    | /website/testimonials            | Public        | Testimonials       |
| GET    | /website/banners                 | Public        | Banners by position|
| POST   | /website/newsletter/subscribe    | Public        | Subscribe          |
| POST   | /website/contact                 | Public        | Contact message    |

---

## 🔐 RBAC Roles

| Role             | Access                                          |
|------------------|-------------------------------------------------|
| `super_admin`    | Everything — no restrictions                    |
| `admin`          | Everything except role assignment               |
| `blog_manager`   | Blog posts, comments, tags only                 |
| `hr_manager`     | Job postings and applications only              |
| `website_manager`| CMS: pages, banners, FAQs, settings only        |
| `instructor`     | Own courses and media only                      |
| `student`        | Read courses, enroll, leave reviews             |

---

## 🛡️ Security Features

- **JWT** with 15-minute access tokens + 30-day httpOnly cookie refresh tokens
- **Token blacklisting** on logout via Redis
- **bcrypt** password hashing (cost factor 12)
- **Rate limiting** — global 100 req/min, auth 10 req/15min
- **Brute-force protection** — account lockout after 5 failures in 15 min
- **Helmet.js** security headers (CSP, HSTS, X-Frame-Options)
- **Zod** input validation on all endpoints
- **CSRF** protection via SameSite cookie
- **Audit logging** — all admin actions tracked in `activity_logs`
- **SQL injection prevention** — parameterized queries everywhere
- **CORS** whitelist-only origin policy

---

## 📊 Database Views

| View                    | Description                          |
|-------------------------|--------------------------------------|
| `vw_student_dashboard`  | Student stats: enrollments, progress |
| `vw_course_stats`       | Course revenue, enrollment counts    |
| `vw_admin_user_list`    | Users with aggregated roles          |
| `vw_revenue_summary`    | Monthly revenue breakdown            |

---

## 🎨 Frontend Pages

| Page                        | Route                         | Access        |
|-----------------------------|-------------------------------|---------------|
| Homepage                    | /                             | Public        |
| Course Catalog              | /courses                      | Public        |
| Course Detail               | /courses/[slug]               | Public        |
| Blog                        | /blog                         | Public        |
| Careers                     | /careers                      | Public        |
| Login                       | /auth/login                   | Guest only    |
| Register                    | /auth/register                | Guest only    |
| Student Dashboard           | /dashboard                    | Student+      |
| My Courses                  | /dashboard/my-courses         | Student+      |
| Certificates                | /dashboard/certificates       | Student+      |
| Profile Settings            | /dashboard/profile            | Student+      |
| Blog Manager                | /dashboard/blog               | Blog Manager+ |
| HR / Careers Manager        | /dashboard/careers            | HR Manager+   |
| Admin Dashboard             | /admin                        | Admin+        |
| Admin Users                 | /admin/users                  | Admin+        |

---

## 📧 Email Templates

| Template              | Trigger                          |
|-----------------------|----------------------------------|
| Email Verification    | On registration                  |
| Password Reset        | Forgot password request          |
| Enrollment Confirmed  | On course enrollment             |
| Certificate Issued    | On 100% course completion        |
| Payment Success       | After successful payment         |

---

## 🔧 Environment Variables

See `backend/.env.example` and `frontend/.env.example` for full list.

**Critical backend variables:**
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — Must be 64+ chars random string
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — Payment processing
- `SENDGRID_API_KEY` — Transactional email

---

## 📝 License

Private — © 2026 InstructorStudio. All rights reserved.
