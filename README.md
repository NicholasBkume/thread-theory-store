# Thread Theory Store

> A full-stack fashion e-commerce application built with React, Express, MongoDB, Redis, Stripe, and Cloudinary. Thread Theory demonstrates a production-style shopping experience with authentication, cart management, product administration, coupons, payments, analytics, and caching.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![Redis](https://img.shields.io/badge/Cache-Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![CI](https://github.com/NicholasBkume/thread-theory-store/actions/workflows/ci.yml/badge.svg)](https://github.com/NicholasBkume/thread-theory-store/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-ISC-blue)](./package.json)

## Live Demo

> https://threadtheorystore.onrender.com/

## Demo Credentials & Test Payments

The live demo includes a dedicated test account for visitors who want to explore the **administrator features**, including the admin dashboard and product-management functionality.

### Admin Demo Account

| Credential | Value |
|---|---|
| **Email** | `test01@gmail.com` |
| **Password** | `test123` |

> **Demo account notice:** This account is intended exclusively for demonstrating the live application's admin functionality. Do not use these credentials for any real service or enter sensitive personal information into the demo account.

### Testing the Purchase / Checkout Flow

The purchase flow uses **Stripe Checkout in test mode**, so no real payment is required. To test a successful checkout, use one of Stripe's official test card numbers:

**Stripe test cards:** [Test card numbers | Stripe Documentation](https://docs.stripe.com/testing#cards)

For a standard successful card payment, Stripe provides the test card number `4242 4242 4242 4242`. Use any future expiration date, any three-digit CVC, and any valid ZIP/postal code when prompted.

> **Important:** These are Stripe test-mode credentials. Do not enter real credit-card information into the demo's test checkout.

## Screenshots

> Add screenshots to `docs/screenshots/` and update the paths below.

| Storefront | Shopping Cart | Admin Dashboard |
|---|---|---|
| `docs/screenshots/storefront.png` | `docs/screenshots/cart.png` | `docs/screenshots/admin-dashboard.png` |

## Features

- User registration, login, logout, profile access, and token refresh.
- JWT-protected routes with administrator authorization.
- Secure, HTTP-only JWT cookies with production-only `Secure` protection.
- Security headers, allowlisted credentialed CORS, and per-route API rate limiting.
- Product browsing, featured products, categories, and recommendations.
- Admin product creation, updates, deletion, and featured-product management.
- Cloudinary-backed product image uploads.
- Shopping cart and coupon workflows.
- Server-authoritative product pricing, quantities, coupons, and inventory at checkout.
- Stripe Checkout integration.
- Verified Stripe webhooks for server-side payment finalization.
- Idempotent order creation keyed by Stripe Checkout Session ID.
- Redis caching for featured products.
- Admin analytics and seven-day sales reporting.
- Responsive React UI with Tailwind CSS, Zustand, Framer Motion, and Recharts.

## Tech Stack

**Frontend:** React 19, Vite, React Router, Zustand, Axios, Tailwind CSS, Framer Motion, Recharts, Stripe.js

**Backend:** Node.js, Express 4, JWT, bcryptjs, cookie-parser

**Data & Services:** MongoDB, Mongoose, Redis/ioredis, Stripe, Cloudinary

**Testing:** Vitest, React Testing Library, jest-dom, User Event, Supertest

**CI/CD:** GitHub Actions

## Architecture

```text
Browser
   |
   v
React + Vite
   |
   | REST API / Axios
   v
Express API
   |---- Security headers + CORS + rate limits
   |---- Auth + JWT middleware
   |---- Product controllers ---- MongoDB
   |---- Cart / Coupon controllers
   |---- Featured cache --------- Redis
   |---- Image uploads ---------- Cloudinary
   |---- Checkout --------------- Stripe
   |                              |
   |                              v
   |                         Signed webhook
   |                              |
   |                              v
   |                         Order finalization
   |---- Analytics
   v
JSON responses
```

### Request flow

1. React pages and Zustand stores initiate API requests.
2. Express applies security headers, CORS policy, and route-specific rate limits.
3. Express routes apply authentication and authorization where required.
4. Controllers perform business logic.
5. MongoDB persists application data.
6. Redis caches featured products.
7. Cloudinary stores product images.
8. Stripe creates Checkout sessions.
9. Stripe sends a signed `checkout.session.completed` or async-payment-success event to `/api/payments/webhook`.
10. The webhook verifies the signature using the raw request body and finalizes the order exactly once using the Stripe session ID.

## Prerequisites

- Node.js 22+ recommended
- npm
- MongoDB or MongoDB Atlas
- Redis-compatible instance
- Stripe account
- Cloudinary account

## Getting Started

### 1. Clone

```bash
git clone https://github.com/NicholasBkume/thread-theory-store.git
cd thread-theory-store
```

### 2. Install dependencies

```bash
npm ci
npm ci --prefix frontend
```

### 3. Configure environment variables

Create a root `.env` file. Use the variable names expected by the backend configuration files and keep all real credentials private.

Typical configuration:

```env
PORT=5000
NODE_ENV=development

MONGO_URL=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
REFRESH_TOKEN_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
TRUST_PROXY=false

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

UPSTASH_REDIS_URL=your_redis_connection_url
```

For production, set `CORS_ORIGINS` to the exact frontend origins that are allowed to send credentialed requests, separated by commas. Set `TRUST_PROXY=true` only when the application is deployed behind a trusted reverse proxy that supplies the client IP.

> `STRIPE_WEBHOOK_SECRET` must be the signing secret for the webhook endpoint configured in Stripe. It is different from `STRIPE_SECRET_KEY`.

### 4. Run locally

Backend:

```bash
npm run dev
```

Frontend in another terminal:

```bash
npm run dev --prefix frontend
```

## Security

The API includes several production-oriented controls without weakening Stripe webhook verification:

- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy` response headers.
- HSTS is enabled in production.
- Express's `X-Powered-By` header is disabled.
- Credentialed CORS is restricted to the `CORS_ORIGINS` allowlist.
- Authentication, payment, product, cart, coupon, and analytics routes have independent request limits.
- JWT cookies are HTTP-only, `SameSite=Strict`, and `Secure` in production.
- JSON request bodies are limited to 10 MB.
- Production errors return a generic internal-server-error response while detailed failures are logged server-side.
- CI runs production-dependency vulnerability checks with `npm audit --omit=dev --audit-level=high`.

The current in-process rate limiter is appropriate for a single application instance. For a horizontally scaled deployment, move rate-limit state to Redis or use a managed edge/API gateway limiter so all instances share the same counters.

## Stripe Webhook Setup

Configure a Stripe webhook endpoint pointing to:

```text
https://YOUR_API_HOST/api/payments/webhook
```

For local development, use the Stripe CLI to forward events to:

```text
http://localhost:5000/api/payments/webhook
```

Set the generated webhook signing secret as `STRIPE_WEBHOOK_SECRET`.

The webhook endpoint intentionally receives the raw JSON body before Express's normal JSON parser. Stripe's signature verification is performed with `stripe.webhooks.constructEvent(...)`; requests with a missing or invalid signature are rejected with HTTP 400.

Handled payment events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Only sessions whose `payment_status` is `paid` are finalized. The finalizer first looks up `stripeSessionId`, so Stripe retries do not create duplicate orders. The `Order` model also enforces uniqueness on `stripeSessionId`.

The existing `/api/payments/checkout-success` endpoint remains available for the storefront success-page flow, but it is idempotent and checks that the Checkout Session belongs to the authenticated user. The webhook is the authoritative server-side payment finalization mechanism.

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `MONGO_URL` | MongoDB connection | Yes |
| `ACCESS_TOKEN_SECRET` | Access JWT signing secret | Yes |
| `REFRESH_TOKEN_SECRET` | Refresh JWT signing secret | Yes |
| `CLIENT_URL` | Frontend URL used by application/payment redirects | Yes |
| `CORS_ORIGINS` | Comma-separated allowed credentialed browser origins | Recommended |
| `TRUST_PROXY` | Enables trusted reverse-proxy client IP handling | Only behind proxy |
| `STRIPE_SECRET_KEY` | Stripe server credential | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification secret | Yes for webhooks |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account identifier | Yes for uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API credential | Yes for uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes for uploads |
| `UPSTASH_REDIS_URL` | Redis connection URL | Yes |

## Testing

Backend tests:

```bash
npm test
```

Frontend tests:

```bash
npm test --prefix frontend
```

Frontend lint/build:

```bash
npm run lint --prefix frontend
npm run build --prefix frontend
```

CI runs backend tests, frontend tests, linting, frontend builds, and high-severity production dependency audits on every push and pull request.

## CI/CD

GitHub Actions is configured in `.github/workflows/ci.yml`.

The workflow uses Node.js 22 and `npm ci` for reproducible installs. It verifies production dependency vulnerabilities before running the test/build pipeline.

## License

ISC
