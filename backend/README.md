# Event Registration Backend

This is the backend for the Event Registration System, built with Node.js, Express, Prisma, and PostgreSQL.

## Features
- Event management (Create, Read, Update)
- Admin authentication with JWT
- Cover image uploads using Multer
- Student event registration
- Prisma ORM for database interaction

## Setup Instructions

1. **Install Dependencies:**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the `.env.example` file to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
   *Make sure you provide a valid `DATABASE_URL` for your PostgreSQL instance.*

3. **Database Migration:**
   Run Prisma migrations to create the database schema:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

5. **Start the Server:**
   For development (uses nodemon):
   ```bash
   npm run dev
   ```

## API Endpoints

### Admin
- `POST /api/admin/login` - Authenticate admin and receive JWT.

### Events
- `GET /api/events` - Get all events (Public).
- `POST /api/events` - Create a new event (Protected, supports `coverImage` file).
- `PUT /api/events/:id` - Update an event (Protected, supports `coverImage` file).

### Registrations
- `POST /api/register` - Register a student for an event (Public). Requires `name`, `email`, `phone`, `eventId`. Optionally `collegeId`, `year`, `branch`, and a `paymentScreenshot` upload.

### Admin Verification
- `GET /api/admin/registrations/:eventId/pending` - Fetch all registrations for a specific event that are pending verification. Requires Admin JWT.
- `PUT /api/admin/registrations/:id/verify` - Approve or reject a pending registration. Requires Admin JWT.
  - Body (Approve): `{ "action": "confirm" }`
  - Body (Reject): `{ "action": "reject", "reason": "optional reason string" }`

## Notes
- Uploaded images are stored in the `/uploads` directory and served statically at `http://localhost:5000/uploads/...`.
## Brevo Email Integration
We use Brevo (formerly Sendinblue) for sending automated confirmation and rejection emails upon manual verification by the admin. 

### Setup Instructions
1. Create a Brevo account and obtain an API key.
2. In your `.env` file, configure the following variables:
   ```env
   BREVO_API_KEY="your_api_key_here"
   BREVO_SENDER_EMAIL="your_verified_sender_email@example.com"
   ```
3. To test the integration before using it in the full flow, you can run the standalone test script:
   ```bash
   node scripts/test-brevo.js
   ```
   *(Note: Remember to change the placeholder email address in the script to your own email address first to see the test email).*

**Important:** Email sending failures are strictly logged to the console (including exact API error responses from Brevo) and do **not** block or crash the registration/verification flow itself. The database will still update accordingly.
