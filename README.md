# Kantin FILKOM — Backend API

A RESTful API for **Kantin FILKOM**, a web-based canteen ordering and payment application built to support canteen discovery, product management, order processing, and merchant operations.

The backend is built with NestJS and TypeScript, uses PostgreSQL for persistent data storage, and Prisma ORM for database access. It also provides JWT-based authentication, role-based access control, and local file uploads for merchant documents, product images, and payment proofs.

## Features

### Authentication & Authorization

* User registration and login.
* JWT-based authentication for protected endpoints.
* Password hashing with bcrypt.
* User profile retrieval through an authenticated endpoint.
* Role-based access control for `USER` and `ADMIN` roles.

### Merchant Management

* Browse available merchants.
* View merchant details.
* Submit merchant applications with supporting permit documents.
* Review and approve merchant applications through administrative endpoints.
* Retrieve shops owned by the authenticated user.
* Manage shop products, including product image uploads and deletion.
* View incoming sales orders for a shop.

### Product Management

* Create products for a merchant.
* Store product names, prices, and image paths.
* Associate products with their respective merchants.

### Order Management

* Create orders containing multiple items.
* Retrieve purchase history and individual order details.
* Track order status throughout the ordering process.
* Upload payment proofs.
* Verify or reject payment submissions.
* Update orders when they are ready for pickup or completed.

### File Uploads

* Store uploaded files locally using Multer.
* Support PDF, JPEG, and PNG files for merchant application documents and payment proofs.
* Support JPEG and PNG files for product images.
* Apply a 5 MB file-size limit to the configured upload endpoints.
* Serve uploaded files through the `/uploads` URL path.

## Tech Stack

| Technology           | Purpose                               |
| -------------------- | ------------------------------------- |
| NestJS 12            | Backend framework                     |
| TypeScript           | Application language                  |
| PostgreSQL           | Relational database                   |
| Prisma ORM 7         | Database access and schema management |
| `@prisma/adapter-pg` | PostgreSQL driver adapter for Prisma  |
| JWT / Passport       | Authentication                        |
| bcrypt               | Password hashing                      |
| class-validator      | Request DTO validation                |
| Multer               | File upload handling                  |
| Jest & Supertest     | Testing                               |

## Architecture Overview

The application follows NestJS's modular architecture. Features are organized into modules, controllers, and services to separate HTTP handling from application logic and database operations.

```text
Client (Vue.js Frontend)
          |
          | HTTP / REST API
          v
     NestJS Application
          |
          +-- Auth Module
          |     +-- Registration
          |     +-- Login
          |     +-- JWT authentication
          |
          +-- Merchants Module
          |     +-- Merchant applications
          |     +-- Merchant information
          |     +-- Product management
          |     +-- Sales management
          |
          +-- Orders Module
          |     +-- Order creation
          |     +-- Purchase history
          |     +-- Payment proof
          |     +-- Order status updates
          |
          +-- Prisma Module
                    |
                    v
                PostgreSQL

Uploaded files --> Local uploads directory
```

## Database Models

The Prisma schema defines the following core models and enums:

| Model / Enum                | Purpose                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `User`                      | Stores user accounts and roles                                        |
| `MerchantApplication`       | Stores merchant applications, supporting documents, and review status |
| `Merchant`                  | Stores merchant information and ownership                             |
| `Product`                   | Stores product information and prices                                 |
| `Order`                     | Represents a purchase made by a user                                  |
| `OrderItem`                 | Stores products and quantities belonging to an order                  |
| `Payment`                   | Stores payment proof paths and payment verification status            |
| `Role`                      | Defines `USER` and `ADMIN` roles                                      |
| `MerchantApplicationStatus` | Defines `UNDER_REVIEW`, `APPROVED`, and `REJECTED`                    |
| `MerchantStatus`            | Defines `ACTIVE` and `SHUTDOWN`                                       |
| `OrderStatus`               | Defines the order lifecycle                                           |
| `PaymentStatus`             | Defines payment verification states                                   |

An order belongs to a buyer and a merchant and can contain multiple order items. Each order item records the product, quantity, and price used for that order. An order can have one associated payment record.

## API Overview

The API uses the `/api` global prefix.

| Method   | Endpoint                                         | Description                                          |
| -------- | ------------------------------------------------ | ---------------------------------------------------- |
| `POST`   | `/api/auth/register`                             | Register a user                                      |
| `POST`   | `/api/auth/login`                                | Authenticate a user                                  |
| `GET`    | `/api/auth/me`                                   | Retrieve the authenticated user's profile            |
| `GET`    | `/api/merchants`                                 | List merchants                                       |
| `GET`    | `/api/merchants/:merchantId`                     | Retrieve merchant details                            |
| `GET`    | `/api/merchants/applications`                    | List merchant applications for administrative review |
| `POST`   | `/api/merchants/application`                     | Submit a merchant application                        |
| `PATCH`  | `/api/merchants/applications/:merchantAppId`     | Process a merchant application                       |
| `GET`    | `/api/merchants/myshops`                         | List the authenticated user's shops                  |
| `GET`    | `/api/merchants/myshops/:merchantId`             | Retrieve a shop owned by the user                    |
| `GET`    | `/api/merchants/myshops/:merchantId/sales`       | Retrieve shop sales orders                           |
| `POST`   | `/api/merchants/myshops/:merchantId/products`    | Create a product                                     |
| `DELETE` | `/api/merchants/:merchantId/products/:productId` | Delete a product                                     |
| `POST`   | `/api/orders`                                    | Create an order                                      |
| `GET`    | `/api/orders/purchases`                          | Retrieve purchase history                            |
| `GET`    | `/api/orders/:orderId`                           | Retrieve order details                               |
| `POST`   | `/api/orders/:orderId/payment`                   | Upload payment proof                                 |
| `PATCH`  | `/api/orders/:orderId/payment/verify`            | Verify a payment                                     |
| `PATCH`  | `/api/orders/:orderId/payment/reject`            | Reject a payment                                     |
| `PATCH`  | `/api/orders/:orderId/ready`                     | Mark an order as ready                               |
| `PATCH`  | `/api/orders/:orderId/complete`                  | Mark an order as completed                           |

Most business endpoints require authentication. Access to specific resources is also checked against the user's role or ownership where implemented. Refer to the controllers and services for the exact request DTOs, response formats, and authorization rules.

## Order & Payment Lifecycle

The application defines these order statuses:

| Status                 | Meaning                                                  |
| ---------------------- | -------------------------------------------------------- |
| `WAITING_PAYMENT`      | Waiting for payment proof                                |
| `WAITING_VERIFICATION` | Payment proof has been submitted and awaits verification |
| `PAID`                 | Payment has been confirmed                               |
| `READY`                | Order is ready for pickup                                |
| `COMPLETED`            | Order has been completed                                 |
| `CANCELLED`            | Order has been cancelled                                 |

Payment records use the following statuses:

* `WAITING_VERIFICATION`
* `VERIFIED`
* `REJECTED`

The backend manages the order and payment status updates. The frontend should retrieve the latest order details after an operation to reflect the current state.

## Prerequisites

Before running the project, install:

* Node.js compatible with the project's dependencies.
* npm.
* PostgreSQL.
* Git.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/razzanrianta/kantin-app.git
cd kantin-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

```env
PORT=3000
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/kantin_filkom?schema=public"
JWT_SECRET="replace-with-a-strong-random-secret"
```

Replace the database username, password, and database name with your local PostgreSQL configuration. Make sure the JWT secret matches the configuration used by the authentication module.

Do not commit your real `.env` file or production secrets to Git.

### 4. Prepare the database

Create the PostgreSQL database specified in `DATABASE_URL`, then generate the Prisma Client:

```bash
npx prisma generate
```

If the repository's existing migrations are available, apply them with:

```bash
npx prisma migrate deploy
```

For local development, when creating a new migration from schema changes, use:

```bash
npx prisma migrate dev --name init
```

Use `--name init` only when creating the initial migration for a new database schema. If the project already has migrations, apply the existing migrations rather than creating an unnecessary initial migration.

### 5. Start the development server

```bash
npm run start:dev
```

The API will listen on the configured port, which defaults to `3000`.

Base URL:

```text
http://localhost:3000/api
```

Uploaded files are served under:

```text
http://localhost:3000/uploads
```

### 6. Run the production build

```bash
npm run build
npm run start:prod
```

## Available Scripts

| Command               | Description                                |
| --------------------- | ------------------------------------------ |
| `npm run start`       | Start the application                      |
| `npm run start:dev`   | Start the development server in watch mode |
| `npm run start:debug` | Start the server in debug mode             |
| `npm run build`       | Compile the application                    |
| `npm run start:prod`  | Run the compiled application               |
| `npm run lint`        | Run ESLint with automatic fixes            |
| `npm run format`      | Format source files with Prettier          |
| `npm run test`        | Run unit tests                             |
| `npm run test:watch`  | Run tests in watch mode                    |
| `npm run test:cov`    | Run tests with coverage                    |
| `npm run test:e2e`    | Run end-to-end tests                       |

## Authentication

Protected endpoints use JWT authentication. After logging in, include the access token in the `Authorization` header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

The authenticated user identity is obtained from the token rather than trusting a user ID supplied by the client.

## File Storage

Uploaded files are currently stored on the local filesystem in the `uploads/` directory, including:

```text
uploads/
├── applicants/
├── products/
└── payments/
```

The application exposes these files through the `/uploads` path. For production deployments, ensure that upload directories exist, persistent storage is configured, and uploaded files are not lost when the application is redeployed.

Local disk storage is suitable for development, but a production deployment with multiple instances may require shared or object storage.

## Frontend Integration

The frontend dashboard is built with Vue 3, TypeScript, Vue Router, Pinia, Axios, and Tailwind CSS.

Frontend repository: [kantin-app-dashboard](https://github.com/razzanrianta/kantin-app-dashboard)

For local development, configure the frontend's API proxy to point to the backend address and port.

## Testing

Run unit tests:

```bash
npm run test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Generate test coverage:

```bash
npm run test:cov
```

## Security Notes

* Keep database credentials and JWT secrets out of source control.
* Use HTTPS and secure environment configuration in production.
* Validate uploaded files and limit upload sizes.
* Enforce authorization and resource ownership checks for merchant and order operations.
* Configure persistent file storage and backups for production.
* Review the authentication and payment-verification logic before deploying publicly.

## License

This repository currently declares `UNLICENSED` in `package.json`. No open-source license is specified.
