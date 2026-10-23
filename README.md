# ResolveIT — IT Service Management Platform

**ResolveIT** is a full-stack IT Service Management (ITSM) application designed to make handling IT support requests more organized. Employees can raise tickets, support agents can manage and resolve them, and administrators can oversee the workflow through role-based access.

## 🔗 Live Demo

- **Live Application:** https://resolveit-zeta.vercel.app
- **Backend API:** https://resolveit-api-qf9p.onrender.com
- **API Health Check:** https://resolveit-api-qf9p.onrender.com/api/health
- **GitHub Repository:** https://github.com/sourodeep004/ResolveIT

> Note: The backend is hosted separately from the frontend. The first request may take longer if the hosting service has put the backend to sleep.

## ✨ Features

- **Role-Based Access Control:** Separate permissions for employees, support agents, and administrators.
- **Ticket Management:** Create, view, update, assign, and track IT support tickets.
- **Ticket Lifecycle:** Manage ticket statuses and follow the workflow from reporting an issue to resolution.
- **Priority and Categories:** Organize tickets by priority and issue category.
- **SLA Tracking:** Calculate ticket deadlines based on priority, with configured SLA targets ranging from 4 to 72 hours.
- **Comments and Collaboration:** Add comments to tickets to keep communication and troubleshooting details in one place.
- **Audit History:** Maintain a history of ticket-related actions for better traceability.
- **Protected API Routes:** Use JWT authentication to secure application endpoints.
- **Input Validation:** Validate incoming API requests to reduce invalid data and unexpected behavior.
- **API Rate Limiting:** Apply request limits to help protect the backend from excessive traffic.
- **Centralized Error Handling:** Handle API errors consistently.
- **Automated Testing:** Test backend API behavior using Vitest and Supertest.
- **Performance Benchmarking:** Use Autocannon to measure ticket API throughput, latency, and failed requests.

## 🛠️ Tech Stack

| Area | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| API Testing | Vitest, Supertest |
| Performance Testing | Autocannon |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | Git, GitHub |

## 🏗️ Architecture

```text
              User
               |
               v
       React.js Frontend
          (Vercel)
               |
          HTTP / REST API
               |
               v
       Express.js Backend
           (Render)
               |
     +---------+----------+
     |         |          |
     v         v          v
 Authentication Ticket   Validation
    (JWT)     Routes
               |
               v
        MongoDB Database
```

The frontend communicates with the backend through REST API endpoints. The backend validates requests, checks authentication and authorization, executes ticket operations, and stores application data in MongoDB.

## 👥 User Roles

### Employee
- Create support tickets.
- View and track submitted tickets.
- Follow ticket updates and comments.

### Support Agent
- View tickets assigned to them.
- Update ticket status and work toward resolution.
- Communicate through ticket comments.

### Administrator
- Access administrative functionality permitted by the application.
- Manage ticket assignments and oversee support workflows.

## 🚀 Getting Started

Follow these steps to run ResolveIT locally.

### Prerequisites

Install the following:

- Node.js and npm
- MongoDB, either locally or through MongoDB Atlas
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/sourodeep004/ResolveIT.git
cd ResolveIT
```

### 2. Install Dependencies

Check the repository structure to identify the frontend and backend directories. Run `npm install` in each application directory that has its own `package.json`.

For a single-package setup, run:

```bash
npm install
```

### 3. Configure Environment Variables

Create the appropriate `.env` files for the backend and frontend, following the environment variable names used by the project.

**Backend configuration:**

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend configuration:**

```env
VITE_API_URL=http://localhost:5000/api
```

Use the actual backend port configured in your application if it differs from `5000`.

For production, configure `VITE_API_URL` with:

```env
VITE_API_URL=https://resolveit-api-qf9p.onrender.com/api
```

**Important:** Never commit real database credentials, JWT secrets, or production environment files to GitHub. Add `.env` to `.gitignore`.

### 4. Start the Backend

Navigate to the backend directory and run the development or start command defined in its `package.json`.

For example:

```bash
npm install
npm start
```

If the project uses a separate development script, use the corresponding command from its `package.json`.

### 5. Start the Frontend

In a separate terminal, navigate to the frontend directory and run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, commonly:

```text
http://localhost:5173
```

Make sure the frontend's `VITE_API_URL` points to the running backend.

## 🔐 Environment Variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `CLIENT_URL` | Frontend origin used for backend CORS configuration |
| `NODE_ENV` | Application environment |
| `VITE_API_URL` | Backend API base URL used by the frontend |

Keep secrets private and use separate development and production values.

## 🧪 Testing

ResolveIT uses Vitest and Supertest to test backend API behavior.

Run the test suite from the directory containing the relevant `package.json`:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate a coverage report:

```bash
npm run test:coverage
```

The coverage report helps identify untested code paths and areas where additional tests may be useful.

## ⚡ API Performance Testing

Autocannon is used to benchmark the ticket API under concurrent requests.

The benchmark script is available at:

```text
server/scripts/benchmark-tickets.js
```

Run it from the backend directory, adjusting the path if your repository structure differs:

```bash
node ./scripts/benchmark-tickets.js
```

Example configuration in PowerShell:

```powershell
$env:BENCH_DURATION = "20"
$env:BENCH_CONNECTIONS = "10"
node .\scripts\benchmark-tickets.js
```

The benchmark can measure:

- Requests per second
- Average latency
- Median latency (p50)
- Higher-percentile latency (such as p97.5 and p99, when reported)
- Total requests
- Non-2xx responses
- Errors and timeouts

For meaningful comparisons, use the same duration, connection count, dataset, and environment before and after a change. Local benchmark results are useful for evaluating relative performance, but they should not be interpreted as production capacity.

## 🔌 API Overview

The backend exposes REST API routes for authentication, ticket management, and analytics.

| Route group | Purpose |
|---|---|
| `/api/health` | Backend health check |
| `/api/auth` | Authentication-related operations |
| `/api/tickets` | Ticket management and workflow |
| `/api/analytics` | Ticket-related analytics |

For the exact endpoints, request bodies, and response formats, refer to the backend route files and application implementation in the repository.

## 📁 Project Structure

The project includes separate frontend and backend responsibilities. The precise folder names may vary depending on the current repository layout.

```text
ResolveIT/
├── client/                  # React frontend, if separated
├── server/                  # Express backend, if separated
│   ├── scripts/
│   │   └── benchmark-tickets.js
│   └── ...
├── package.json
└── README.md
```

The `client/` and `server/` names above illustrate a common layout; adjust them to match the actual folders in your repository.

## 🔒 Security Considerations

- Keep secrets in environment variables.
- Protect private endpoints with authentication and role checks.
- Validate request parameters and user input.
- Apply rate limiting to API requests.
- Avoid exposing internal errors or sensitive configuration to clients.
- Use HTTPS for deployed frontend and backend communication.

## 🎯 What I Learned

Building ResolveIT provided practical experience with:

- Designing and implementing REST APIs.
- Integrating React, Express, and MongoDB.
- Implementing JWT authentication and role-based permissions.
- Modeling ticket workflows, SLA deadlines, and audit history.
- Writing automated API tests and reviewing coverage.
- Investigating MongoDB query plans and index usage.
- Measuring API latency and throughput with load-testing tools.
- Deploying a full-stack application using Vercel and Render.

## 🛣️ Future Improvements

- Add notifications for ticket assignments and approaching SLA deadlines.
- Expand automated tests for edge cases and permission boundaries.
- Add more detailed operational monitoring and structured logging.
- Evaluate query performance using representative, larger datasets.
- Introduce pagination and filtering improvements as ticket volume grows.

## 👨‍💻 Author

**Sourodeep Saha**

- GitHub: https://github.com/sourodeep004

---

If you find the project useful, feel free to explore the repository and share feedback.
