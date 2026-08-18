const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Load env vars
dotenv.config();

const adminRoutes = require("./routes/adminRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const frontendUrl = 'event-registration-automation-system-5y96nz26n.vercel.app' || process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: frontendUrl,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/register", registrationRoutes);

// Health check
app.get("/health", (req, res) => {
    res.json({ message: "Backend is running!" });
});

// Centralized error handler
app.use(errorHandler);

const { startCronJobs } = require('./utils/cronJobs');

// Start background cron jobs
startCronJobs();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});