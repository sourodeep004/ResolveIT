# ResolveIT --- IT Service Management Platform

ResolveIT is a role-based IT service management platform for managing
internal support tickets. It supports employees, agents, and
administrators with ticket workflows, priority-based SLA deadlines,
authentication, and analytics.

## Features

-   **JWT authentication:** Register and log in securely.
-   **Role-based access:** Employee, agent, and admin roles.
-   **Ticket management:** Create and track support tickets with
    categories, priorities, and statuses.
-   **Assignment and workflow:** Assign tickets to support staff and
    update ticket status.
-   **Priority-based SLA targets:** Critical --- 4 hours; High --- 8
    hours; Medium --- 24 hours; Low --- 72 hours.
-   **Analytics API:** Ticket summary metrics, status/category
    breakdowns, and average resolution time for authorized agents and
    administrators.
-   **API security:** Helmet security headers, CORS configuration,
    request-size limits, and rate limiting.
-   **Automated testing:** Vitest and Supertest.
-   **Coverage reporting:** Vitest with V8 coverage.
-   **Preliminary performance testing:** Autocannon.

## Tech Stack

  Area             Technologies
  ---------------- ------------------------------------------
  Frontend         React, Vite
  Backend          Node.js, Express.js
  Database         MongoDB, Mongoose
  Authentication   JWT, bcryptjs
  Validation       express-validator
  Security         Helmet, CORS, express-rate-limit
  Testing          Vitest, Supertest, mongodb-memory-server
  Coverage         @vitest/coverage-v8
  Load testing     Autocannon

## Project Structure

``` text
resolveit/
├── client/                 # React + Vite frontend
├── server/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Authentication and error handling
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # Authentication, tickets, analytics
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── screenshots/            # Project screenshots
└── README.md
```

## Prerequisites

-   Node.js and npm
-   MongoDB (local or hosted)
-   Git

## Local Setup

### 1. Clone the repository

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd resolveit
```

### 2. Configure the backend

``` bash
cd server
npm install
```

Create `server/.env` and set the following values:

``` dotenv
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_characters
CLIENT_URL=http://localhost:5173
```

Keep real credentials in `.env`. Never commit `.env` or put database
credentials or JWT secrets in this README.

### 3. Start the backend

``` bash
npm run dev
```

The API should start at `http://localhost:5000` after connecting to
MongoDB.

Health check: `GET http://localhost:5000/api/health`

Expected response:

``` json
{
  "status": "ok",
  "service": "ResolveIT API"
}
```

### 4. Configure and start the frontend

Open a second terminal:

``` bash
cd client
npm install
```

If the frontend reads `VITE_API_URL`, create `client/.env`:

``` dotenv
VITE_API_URL=http://localhost:5000
```

Set this variable to the exact base URL expected by your frontend API
client. Then run:

``` bash
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`.

## Automated Tests

From the `server` directory:

``` bash
npm test
npm run test:coverage
```

The HTML coverage report is generated under `server/coverage/`; open
`server/coverage/index.html` in a browser.

The latest captured report during development showed:

  Metric         Coverage
  ------------ ----------
  Statements       76.51%
  Branches         65.94%
  Functions        88.88%
  Lines            77.32%

Coverage can change when code or tests change. Re-run the command before
publishing updated figures.

## API Overview

  --------------------------------------------------------------------------
  Method                  Endpoint                   Purpose
  ----------------------- -------------------------- -----------------------
  GET                     `/api/health`              Health check

  POST                    `/api/auth/register`       Register an account

  POST                    `/api/auth/login`          Log in

  GET                     `/api/auth/me`             Get the authenticated
                                                     user's profile

  ---                     `/api/tickets`             Ticket operations; see
                                                     route implementation
                                                     for supported methods

  GET                     `/api/analytics/summary`   Analytics summary for
                                                     authorized
                                                     agents/admins
  --------------------------------------------------------------------------

Protected endpoints use a bearer token:

``` http
Authorization: Bearer <JWT_TOKEN>
```

Check the route files for exact ticket endpoints, request bodies, and
permissions.

## Screenshots

Add only screenshots that exist and show implemented features. For
example:

``` text
screenshots/
├── 01-login.png
├── 02-dashboard.png
├── 03-ticket-management.png
├── 04-ticket-details.png
└── 07-test-coverage.png
```

Embed an image using Markdown:

``` markdown
![Test coverage report](./screenshots/07-test-coverage.png)
```

## Security Notes

-   Use a unique, randomly generated `JWT_SECRET` of at least 32
    characters.
-   Never commit `.env` files, access tokens, database URLs, or
    production credentials.
-   Configure `CLIENT_URL` for the intended frontend origin(s).
-   Treat load-test results as preliminary unless repeated under
    controlled conditions with successful HTTP responses.

## Project Status

ResolveIT is a portfolio project demonstrating backend API design,
role-based access control, database modeling, automated testing, and
preliminary performance testing. Add deployment URLs here after the live
application has been deployed and verified.

## License

Add a license before distributing the project publicly. Without a
license, standard copyright restrictions apply.
