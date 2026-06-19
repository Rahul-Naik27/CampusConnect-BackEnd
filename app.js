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
const UploadRoutes = require("./routes/upload");

const app = express();

// ── CORS — allow localhost + any *.vercel.app subdomain ──
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // Allow any localhost port (dev)
      if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      // Allow all Vercel preview + production URLs (*.vercel.app)
      if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return callback(null, true);
      // Allow the explicitly set FRONTEND_URL (e.g. custom domain)
      if (FRONTEND_URL && origin === FRONTEND_URL) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
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
app.use("/api/v1/upload", UploadRoutes);

// ── Health Check ──
app.get("/", (_req, res) => res.send("🎟️ CampusConnect API running"));

// ── Global Error Handler (must be last) ──
app.use(errorHandler);

// ── DB — connect once at startup, then start server ──
const PORT = process.env.PORT || 5000;

// In production (Vercel), DB connection is handled per-request in api/index.js
// In development, connect at startup and start the HTTP server
if (process.env.NODE_ENV !== "production") {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server started at http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("❌ Failed to connect to DB:", err);
      process.exit(1);
    });
}

// ── Required for Vercel serverless ──
module.exports = app;
