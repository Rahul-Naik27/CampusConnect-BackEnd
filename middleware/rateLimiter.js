const rateLimit = require("express-rate-limit");

// Only apply rate limiting in production — in dev it blocks normal browser usage
const limiter =
  process.env.NODE_ENV === "production"
    ? rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000,
        message: "Too many requests. Try later.",
        standardHeaders: true,
        legacyHeaders: false,
      })
    : (_req, _res, next) => next(); // no-op in development

module.exports = limiter;
