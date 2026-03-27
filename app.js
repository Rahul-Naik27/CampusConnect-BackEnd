const express = require("express");
const dotenv = require("dotenv");

// ── MUST be first before anything else ──
dotenv.config();

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
const RegistrationRoutes = require("./routes/registrations");
const TicketRoutes = require("./routes/tickets");
const FeedbackRoutes = require("./routes/feedback");
const CheckinRoutes = require("./routes/checkin");
const AdminRoutes = require("./routes/admin");
const UserRoutes = require("./routes/userRoutes");
const ChatbotRoutes = require("./routes/chatbot");

const app = express();

// ── DB ──
connectDB();

// ── CORS — allow localhost + Vercel frontend ──
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (Postman, curl, mobile)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(limiter);

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

// ── Health Check ──
app.get("/", (_req, res) => res.send("🎟️ CampusConnect API running"));

// ── Global Error Handler (must be last) ──
app.use(errorHandler);

// ── Only listen locally — Vercel handles this in production ──
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server started at http://localhost:${PORT}`);
  });
}

// ── Required for Vercel serverless ──
module.exports = app;
