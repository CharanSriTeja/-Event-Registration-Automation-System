# 🎟️ Event Registration Automation System

> Built for the **SRKR Coding Club — Web Developer Role Assessment**
> **Developer:** Chilukuri Charan Sri Teja (Charan)

A full-stack event registration and automation platform for college club events, covering the **complete lifecycle**:

```
Public Registration → Manual Payment Verification → Automated QR Entry Passes → Volunteer Check-in Scanning
```

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture & Key Decisions](#architecture--key-decisions)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Deployment](#deployment)
- [Known Limitations & Future Work](#known-limitations--future-work)

---

## Overview

This system manages the end-to-end workflow for college club events:

1. **Students** browse events and submit registrations with payment screenshots (no login required)
2. **Admins** review payment proofs and approve/reject registrations via a dashboard
3. **On approval**, confirmation emails are sent automatically via Brevo
4. **QR codes** are generated and emailed to confirmed registrants — either manually triggered, scheduled, or automatically sent the day before the event via a cron job
5. **Volunteers** use a mobile-first scanner page to validate QR codes at the venue entrance, with real-time duplicate prevention

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (hosted on Neon — serverless) |
| **ORM** | Prisma |
| **Frontend** | React 19 (Vite), Tailwind CSS v4, Framer Motion, React Router v7 |
| **File/Image Storage** | Cloudinary (migrated from local disk to solve Render's ephemeral filesystem limitation) |
| **Email** | Brevo (transactional API) — confirmation, rejection, and QR-delivery emails |
| **QR Generation** | `qrcode` npm package |
| **QR Scanning** | `html5-qrcode` — live camera scan + file-upload fallback |
| **Scheduling** | `node-cron` — automated and rate-limited QR delivery jobs |
| **Auth** | JWT-based, role-based (admin / volunteer), passwords hashed with bcrypt |
| **Deployment** | Backend on Render · Frontend on Vercel |

---

## Features

### 🌐 Student-Facing (No Login Required)

- Public event listing page with cover photos, dates, and venues
- Registration form: name, email, phone, college ID, year, branch
- Payment screenshot upload (manual verification model — no live payment gateway by deliberate scope decision)
- **Unique registration ID** auto-generated per event in the format `EVT-{eventId}-{year}-{0001}`. This uses an **atomic counter-table approach** (`INSERT ... ON CONFLICT DO UPDATE ... RETURNING`) to prevent race conditions under concurrent registrations, replacing a previous non-atomic method that was vulnerable to unique constraint errors.

---

### 🛠️ Admin Dashboard (Role: `admin`)

- **Event CRUD** — create/edit events with Cloudinary-backed cover photo uploads
- **Pending registrations review** — view uploaded payment screenshots, approve or reject each entry
  - On Approve → confirmation email (Brevo) + WhatsApp notification *(stubbed)*
  - On Reject → rejection email with optional reason
- **Live stats dashboard** — total registered, confirmed, and entered counts
- **Searchable/filterable registrant list** — filter by name, registration ID, or branch
- **QR delivery system:**
  - **Instant Trigger** — immediately sends QR codes to all eligible (`confirmed` + `qrSent: false`) registrants (for demo/testing)
  - **Scheduled Jobs** — admin sets timing (now / +1hr / +2hr / custom datetime), a send-rate limit (10/20/30/60 per minute), and an optional partial-audience cap (e.g., "first 50 of 200 eligible") — persisted as `QrSendJob` DB records and processed by a cron job every minute, so scheduling **survives server restarts**
  - **Daily Auto-cron** — automatically sends QR codes to all confirmed registrants the day before their event
- **Volunteer account management** — create/list/delete volunteer login accounts (admin sets username + password; shown once on creation, since passwords are hashed and unrecoverable)

---

### 📷 Volunteer Scanner (Role: `volunteer` or `admin`)

- Dedicated mobile-first scanner page
- **Live camera QR scanning** via `html5-qrcode` with automatic back-camera preference on mobile
- **File-upload fallback** — scan a QR from an image file (useful for laptop webcams or camera-access issues)
- **Real-time entry validation** — atomic backend check prevents duplicate entry; a registration can only be scanned once (single atomic DB update, not read-then-write)
- **Clear visual feedback:**
  - ✅ Green — "Entry Granted"
  - ❌ Red — "Entry Denied — already scanned at [time]" or "Invalid registration ID"

---

## Architecture & Key Decisions

> These decisions were deliberate trade-offs, documented explicitly rather than hidden.

### 1. No Student Authentication
Registration is public/anonymous by design, identified only by the generated `registrationId` + email/phone. Forcing sign-in adds friction for one-time event registration and is unnecessary for this use case.

### 2. Manual Payment Verification (No Payment Gateway)
Admins review uploaded payment screenshots and approve/reject registrations. Razorpay/payment gateway integration is the clear "next step" for a production version but was deliberately out of scope given the assessment timeline.

### 3. WhatsApp Notifications are Stubbed
The function exists with the correct interface and logs intended messages, but is not fully integrated with the WhatsApp Business API — Meta's business verification process has an unpredictable approval timeline incompatible with the assessment deadline. **Email via Brevo is the primary, fully working notification channel.**

### 4. Cloudinary for All File Storage
Event cover photos, payment screenshots, and generated QR codes are all stored on Cloudinary rather than local disk. This is specifically because **Render's free tier has ephemeral storage** — files written to disk would be wiped on every redeploy or restart.

### 5. Minimal QR Payload
QR codes encode **only the `registrationId` string** — no personal data — keeping the payload minimal for both privacy and scan reliability.

### 6. Atomic DB Operations at Every Concurrency-Sensitive Point
- **Registration ID generation** — Uses an atomic upsert on an `EventCounter` table (`INSERT ... ON CONFLICT DO UPDATE ... RETURNING`) to safely increment the registration ID. This guarantees race condition safety under concurrent registrations without application-level locking.
- **Entry scanning** — single conditional atomic update prevents double-entry, even under concurrent volunteer scans

### 7. Rate-Limited, Job-Based QR Sending
QR emails are sent via a DB-persisted `QrSendJob` model processed by a cron job every minute. This avoids firing all emails at once, which would trigger Brevo's spam/rate-limit thresholds on large registrant lists. Scheduling also survives server restarts.

### 8. API Endpoint Rate Limiting
To prevent abuse, public-facing endpoints are protected using `express-rate-limit`:
- **Registration (`/api/register`)**: Max 10 attempts per 15 minutes per IP.
- **Logins (`/api/admin/login` & `/api/auth/login`)**: Max 5 attempts per 15 minutes per IP.

---

## Project Structure

```
Event-Registration/
├── backend/
│   ├── config/            # Prisma client, Cloudinary config
│   ├── controllers/       # Route handler logic
│   ├── middleware/         # JWT auth, role guards
│   ├── models/            # (legacy) model helpers
│   ├── prisma/
│   │   ├── schema.prisma  # DB schema (Event, Registration, User, QrSendJob, etc.)
│   │   ├── migrations/    # Prisma migration history
│   │   └── seed.js        # Seeds first admin account
│   ├── routes/            # Express route definitions
│   ├── scripts/           # Utility scripts (e.g., test-brevo.js)
│   ├── utils/             # Email helpers, QR generation, cron jobs
│   ├── server.js          # Express app entry point
│   ├── .env.example       # Environment variable template
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/           # Axios instance & API helpers
    │   ├── components/    # Shared UI components (ProtectedRoute, etc.)
    │   ├── context/       # React context (auth, etc.)
    │   ├── pages/
    │   │   ├── admin/     # Admin dashboard pages
    │   │   └── ...        # Student-facing & volunteer pages
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Setup & Installation

### Prerequisites

- Node.js ≥ 18
- A PostgreSQL database (local or [Neon](https://neon.tech) for serverless)
- A [Cloudinary](https://cloudinary.com) account (free tier works)
- A [Brevo](https://www.brevo.com) account for transactional email (free tier works)

---

### Backend

**1. Install dependencies**
```bash
cd backend
npm install
```

**2. Configure environment variables**

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `5000`) |
| `DATABASE_URL` | PostgreSQL connection string (e.g., from Neon) |
| `JWT_SECRET` | Secret key for signing JWTs |
| `ADMIN_SEED_USERNAME` | Username for the seeded admin account |
| `ADMIN_SEED_PASSWORD` | Password for the seeded admin account |
| `FRONTEND_URL` | Frontend URL for CORS (e.g., `http://localhost:5173`) |
| `BREVO_API_KEY` | Brevo transactional email API key |
| `BREVO_SENDER_EMAIL` | Verified sender email address in Brevo |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

**3. Run database migrations**
```bash
npx prisma migrate deploy
```

**4. Seed the first admin account**
```bash
node prisma/seed.js
```
> ⚠️ Uses `ADMIN_SEED_USERNAME` and `ADMIN_SEED_PASSWORD` from your `.env`. Run this only once.

**5. Start the server**
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The backend will be running at `http://localhost:5000`.

---

### Frontend

**1. Install dependencies**
```bash
cd frontend
npm install
```

**2. Configure environment variables**

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> For production, set this to your deployed backend URL.

**3. Start the dev server**
```bash
npm run dev
```

The frontend will be running at `http://localhost:5173`.

**4. Build for production**
```bash
npm run build
```

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| **Backend** | [Render](https://render.com) (free tier) | Node.js web service — set all env vars in Render's dashboard |
| **Database** | [Neon](https://neon.tech) (free tier) | Serverless PostgreSQL — copy the connection string to `DATABASE_URL` |
| **Frontend** | [Vercel](https://vercel.com) | Static Vite build — set `VITE_API_BASE_URL` in Vercel project settings |
| **File Storage** | [Cloudinary](https://cloudinary.com) (free tier) | All uploads stored here — no ephemeral disk dependency |

> **Render Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
>
> **Render Start Command:** `node server.js`

---

## Known Limitations & Future Work

| # | Limitation | Notes |
|---|---|---|
| 1 | **No automated tests** | Manual testing only — would add Jest/Supertest given more time |
| 2 | **No real payment gateway** | Manual screenshot verification instead of Razorpay/Stripe |
| 3 | **WhatsApp notifications stubbed** | Email (Brevo) is the fully working notification channel |
| 4 | **No duplicate-registration prevention** | Same email could register twice for the same event — would add a unique DB constraint |
| 6 | **No centralized error monitoring** | Relies on Render's console logs — would integrate Sentry in production |
| 7 | **Laptop webcam QR scanning reliability** | Mobile is the primary supported scanning device, matching realistic use (volunteers at event entrances with phones) |
| 8 | **Certificate generation** | Planned: auto-generate/email participation certificates based on `entered: true` status post-event — not yet built |

---

## 📬 Contact

**Chilukuri Charan Sri Teja**
Built as part of the SRKR Coding Club Web Developer Role Assessment.
