# Artist Booking & Review API

A robust, production-grade backend system for booking artists and reviewing completed gigs. The project utilizes a dual-database architecture: **PostgreSQL** for relational data (Users and Bookings) and **MongoDB** for unstructured records (Reviews).

---

## How to Run the Project Locally

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v16+ recommended)
*   [PostgreSQL](https://www.postgresql.org/) database - create a db named 'baa'
*   [MongoDB](https://www.mongodb.com/) database - create a db named 'baa'

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd BAA_BE
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (or update the existing one) with your database connection strings and secret keys:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
APP_URL=http://localhost:5000

# Database Settings
DATABASE_URL=postgresql://postgres:password@localhost:5432/baa
MONGODB_URI=mongodb://127.0.0.1:27017/baa

# Pool Configuration
PG_MAX_POOL=10
PG_MIN_POOL=2
MONGO_MAX_POOL=10
MONGO_MIN_POOL=2

# Security & CORS
JWT_SECRET=your_secret_jwt_key
CORS_ORIGIN=*
```

### 4. Database Setup & Initialization
*   The database tables (`users`, `bookings`) are **automatically initialized** in PostgreSQL on startup if they do not exist.
*   No manual schema import or SQL scripts are required to boot the application.

### 5. Start the Server
*   For development (hot reload):
    ```bash
    npm run dev
    ```
*   For production execution:
    ```bash
    npm start
    ```
<!-- Note check for database connectivity before moving forward  -->

---

##  API Testing & Interactive Documentation
Once the server is running, you can access the interactive Swagger UI to authorize endpoints and make request tests:
 **`http://localhost:5000/docs`**

The system exposes 5 main endpoints:
1.  `POST /auth/signup` - Register a new client or artist user.
2.  `POST /auth/login` - Authenticate credentials and receive a JWT token.
3.  `POST /bookings` - Request a booking (Client only, checks schedule overlaps).
4.  `GET /bookings` - Paginated booking list (Client sees created bookings; Artist sees assigned bookings).
5.  `PATCH /bookings/:id/status` - Progress booking status through the state machine.
6.  `POST /artists/:id/reviews` - Submit review for completed bookings (Client only, checks database relations).
7.  `GET /artists/:id/reviews` - Fetch paginated reviews list and aggregate rating metrics.

---

##  Design Decisions & Trade-offs

### 1. Modular Service/Repository Architecture

*   **Decision:** 
Structured each module (`auth`, `booking`, `artist`) with a strict separation of concerns: route mappings parse request parameters, controllers validate input payload schemas (via **Zod**), service files handle transactional business rules, and repository helpers perform raw queries.

*   **Trade-off:** Adds minor directory structure complexity, but ensures code readability, modular testability, and isolated database refactorings.




### 2. Single-Query Cross-Database Referential Checks
*   **Decision:** 
To review an artist, we must verify that a completed booking exists between the client and the artist. Since users and bookings are in PostgreSQL, we execute a single relational database join query (`verifyBookingForReview`) to audit all booking constraints (status, IDs, and artist roles) before creating the review document in MongoDB.

*   **Trade-off:** Couples the reviews controller with a bookings SQL helper, but avoids executing multiple database round-trips, ensuring referential integrity and performance.




### 3. Non-Blocking Custom Request Logger
*   **Decision:** 
Replaced the external `morgan` dependency with a custom request logger middleware (`logger.js`). It uses Node's native `Date.now()` differences and wraps execution in `setImmediate()` to defer formatting calculations to the event loop's check phase.

*   **Trade-off:** Avoided importing third-party packages, guaranteeing that client responses are never blocked by logging calculations. We actually need as much as non blocking code as possible to make sure it dont create problem when scaling.




### 4. Centralized Swagger Configurations
*   **Decision:** 
Configured route descriptions directly inside `src/config/swagger.js` instead of writing long inline JSDoc route comments.

*   **Trade-off:** Keeps the codebase clean, though API specs updates must be handled inside `swagger.js` rather than in individual route files.




### 5. PostgreSQL Selection
*   **Decision:** I am more comfortable with PostgreSQL, but switching to mysql wont take me time.
