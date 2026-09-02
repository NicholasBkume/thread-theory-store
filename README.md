# Thread Theory Store

> A full-stack fashion e-commerce application built with React, Express, MongoDB, Redis, Stripe, and Cloudinary. Thread Theory demonstrates a production-style shopping experience with authentication, cart management, product administration, coupons, payments, analytics, and caching.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![Redis](https://img.shields.io/badge/Cache-Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![License](https://img.shields.io/badge/license-ISC-blue)](./package.json)

## Live Demo

> https://threadtheorystore.onrender.com/

## Screenshots

> Add screenshots to `docs/screenshots/` and update the paths below.

| Storefront | Shopping Cart | Admin Dashboard |
|---|---|---|
| `docs/screenshots/storefront.png` | `docs/screenshots/cart.png` | `docs/screenshots/admin-dashboard.png` |

## Features

- User registration, login, logout, profile access, and token refresh.
- JWT-protected routes with administrator authorization.
- Product browsing, featured products, categories, and recommendations.
- Admin product creation, updates, deletion, and featured-product management.
- Cloudinary-backed product image uploads.
- Shopping cart and coupon workflows.
- Stripe Checkout integration.
- Order creation after successful payment verification.
- Redis caching for featured products.
- Admin analytics and seven-day sales reporting.
- Responsive React UI with Tailwind CSS, Zustand, Framer Motion, and Recharts.

## Tech Stack

**Frontend:** React 19, Vite, React Router, Zustand, Axios, Tailwind CSS, Framer Motion, Recharts, Stripe.js

**Backend:** Node.js, Express 4, JWT, bcryptjs, cookie-parser

**Data & Services:** MongoDB, Mongoose, Redis/ioredis, Stripe, Cloudinary

**Testing:** Vitest, React Testing Library, jest-dom, User Event, Supertest

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
   |---- Auth + JWT middleware
   |---- Product controllers ---- MongoDB
   |---- Cart / Coupon controllers
   |---- Featured cache --------- Redis
   |---- Image uploads ---------- Cloudinary
   |---- Checkout --------------- Stripe
   |---- Analytics
   v
JSON responses
```

### Request flow

1. React pages and Zustand stores initiate API requests.
2. Express routes apply authentication and authorization where required.
3. Controllers perform business logic.
4. MongoDB persists application data.
5. Redis caches featured products.
6. Cloudinary stores product images.
7. Stripe creates checkout sessions and confirms payment state.

## Prerequisites

- Node.js 20+ recommended for the current Vitest toolchain
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
npm install
npm install --prefix frontend
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

STRIPE_SECRET_KEY=your_stripe_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

REDIS_URL=your_redis_connection_url
```

> Verify the exact environment variable names in `backend/lib/` before deployment because service configuration should match the repository implementation.

### 4. Run locally

Backend:

```bash
npm run dev
```

Frontend in another terminal:

```bash
npm run dev --prefix frontend
```

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `MONGO_URL` | MongoDB connection | Yes |
| `ACCESS_TOKEN_SECRET` | Access JWT signing secret | Yes |
| `REFRESH_TOKEN_SECRET` | Refresh JWT signing secret | Yes |
| `CLIENT_URL` | Frontend URL used by application/payment redirects | Yes |
| `STRIPE_SECRET_KEY` | Stripe server credential | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account identifier | Yes for uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API credential | Yes for uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes for uploads |
| `REDIS_URL` | Redis connection | Yes for caching |
| `PORT` | Express server port | No |
| `NODE_ENV` | Runtime environment | Recommended |

Never commit real secrets.

## API Documentation

Base URL: `/api`

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Register a user |
| POST | `/auth/login` | Public | Authenticate a user |
| POST | `/auth/logout` | Authenticated | End session |
| POST | `/auth/refresh-token` | Public/refresh flow | Refresh access credentials |
| GET | `/auth/profile` | Authenticated | Get current profile |

### Products

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/products` | Admin | Get all products |
| GET | `/products/featured` | Public | Get featured products |
| GET | `/products/category/:category` | Public | Get products by category |
| GET | `/products/recommendations` | Public | Get recommended products |
| GET | `/products/:id` | Admin | Get one product |
| POST | `/products` | Admin | Create product |
| PATCH | `/products/:id/feature` | Admin | Toggle featured status |
| PUT | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Delete product |

### Cart

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/cart` | Authenticated | Get current user's cart |
| POST | `/cart` | Authenticated | Add a product to the cart |
| PUT | `/cart/:id` | Authenticated | Update item quantity |
| DELETE | `/cart` | Authenticated | Remove one item or clear cart |

### Coupons

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/coupons` | Authenticated | Get active user coupon |
| POST | `/coupons/validate` | Authenticated | Validate a coupon code |

### Payments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/payments/create-checkout-session` | Authenticated | Create Stripe Checkout session |
| POST | `/payments/checkout-success` | Authenticated | Verify successful checkout and create order |

### Analytics

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/analytics` | Admin | Get analytics and seven-day sales data |

### Health

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Lightweight service health check |

## Available Scripts

### Root

| Command | Description |
|---|---|
| `npm run dev` | Start backend with Nodemon |
| `npm run build` | Install dependencies and build frontend |
| `npm start` | Start production Express server |
| `npm test` | Run backend tests once |
| `npm run test:watch` | Run backend tests in watch mode |

### Frontend

| Command | Description |
|---|---|
| `npm run dev --prefix frontend` | Start Vite development server |
| `npm run build --prefix frontend` | Create production build |
| `npm run lint --prefix frontend` | Run ESLint |
| `npm test --prefix frontend` | Run React component tests once |
| `npm run test:watch --prefix frontend` | Run frontend tests in watch mode |
| `npm run preview --prefix frontend` | Preview production build |

## Testing

Priority 2.5 expands the automated suite across the application's security-sensitive and revenue-critical backend paths.

### Backend — Vitest + Supertest

Run:

```bash
npm test
```

Coverage includes:

- Express health endpoint and unknown-route integration behavior.
- Product Mongoose schema validation, required fields, and negative-price rejection.
- Authentication middleware: missing, expired, invalid, and valid access-token paths.
- Authorization middleware: customer denial and admin access.
- Authentication controllers: signup, duplicate signup, login success/failure, refresh-token validation, token rotation, and logout cookie cleanup.
- Product controllers: listing, lookup, category filtering, Redis-backed featured products, creation, and missing-product deletion.
- Cart controllers: add, increment, remove-one, clear-all, quantity updates, zero-quantity removal, and cart hydration.
- Coupon controllers: active lookup, missing codes, valid coupons, and expiration/deactivation.
- Stripe checkout: invalid carts, line-item/cents calculation, session creation, and coupon discount handling.

External services are mocked in unit tests so the suite does not charge cards, upload files, mutate production Redis, or require live third-party credentials.

### Frontend — Vitest + React Testing Library

Run:

```bash
npm test --prefix frontend
```

The current component test verifies that the home page renders its category catalogue and featured-product section. React Testing Library runs against a `jsdom` browser environment, with `jest-dom` matchers enabled through the test setup file.

### Watch mode

```bash
npm run test:watch
npm run test:watch --prefix frontend
```

> The GitHub integration can modify and inspect repository files but cannot execute the repository's local npm test suite. Run the commands above locally or in CI to obtain the authoritative pass/fail result.

## Production Build

```bash
npm run build
NODE_ENV=production npm start
```

In production, Express serves `frontend/dist`.

## Deployment

The application is structured for deployment as a Node.js service. Configure all database and third-party credentials through the hosting provider's environment-variable settings.

Recommended production workflow:

```text
Git push
   ↓
Install dependencies
   ↓
Lint
   ↓
Automated tests
   ↓
Build frontend
   ↓
Deploy
```

## Security Notes

- Keep JWT, Stripe, Cloudinary, MongoDB, and Redis credentials private.
- Use HTTPS in production.
- Restrict administrator privileges.
- Validate request payloads before persistence.
- For production payments, add Stripe webhook signature verification so orders can be finalized independently of the browser success redirect.

## Monitoring Roadmap

Recommended production improvements:

- Structured request/error logging
- `GET /health` health endpoint
- Error tracking service
- Uptime monitoring
- Performance metrics

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Run linting and tests.
5. Open a pull request with a clear description.

Do not include secrets or production credentials in issues or pull requests.

## License

Distributed under the ISC license listed in `package.json`.

## Author

**Nicholas Kume**

- GitHub: https://github.com/NicholasBkume
