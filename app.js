const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./conn/conn");
const cookieParser = require("cookie-parser");

// ── Middleware ──
const limiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

// ── Routes ──
const AuthRoutes = require("./routes/auth");
const EventRoutes = require("./routes/events");
const RegistrationRoutes = require("./routes/registrations"); // ← fixed filename
const TicketRoutes = require("./routes/tickets");
const FeedbackRoutes = require("./routes/feedback");
const CheckinRoutes = require("./routes/checkin");
const AdminRoutes = require("./routes/admin");
const UserRoutes = require("./routes/userRoutes");
const ChatbotRoutes = require("./routes/chatbot");

dotenv.config();
const app = express();

// ── DB ──
connectDB();

// ── Global Middleware ──
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(limiter); // ← rate limiter BEFORE routes

// ── API Routes ──
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/events", EventRoutes);
app.use("/api/v1/registrations", RegistrationRoutes);
app.use("/api/v1/tickets", TicketRoutes);
app.use("/api/v1/feedback", FeedbackRoutes);
app.use("/api/v1/checkin", CheckinRoutes);
app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/chatbot", ChatbotRoutes);

// ── Health check ──
app.get("/", (_req, res) => res.send("🎟️ CampusConnect API running"));

// ── Global Error Handler (must be last) ──
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server started at http://localhost:${PORT}`);
  });
}

module.exports = app;
