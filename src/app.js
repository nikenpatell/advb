const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * High-Performance Security & Response Optimization.
 * Helmet headers + Gzip compression + CORS isolation.
 */
app.use(cors());
app.use(helmet());
app.use(compression()); 

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); 
}

// Global API Rate Limiting - Optimized for SaaS scale
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300, // Adjusted for Dashboard usage
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  message: { success: false, message: "Security Block: Too many requests from this address. Please wait 15 minutes." }
});

/* 
// Stricter Auth Limiter to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // Max 15 login/register attempts
  message: { success: false, message: "Security Block: Multiple auth failures detected. Try again in 10 minutes." }
});

app.use("/api/auth", authLimiter);
*/
app.use("/api", globalLimiter);

// Litigation Portfolio Module - Direct registration for workstation consistency
app.use("/api/cases", require("./routes/case.routes"));

// Central API Router (for remaining routes)
app.use("/api", routes);

// Final Catch-all - Industrial fall-through handling
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint resource not found." });
});

// Production Grade Error Management
app.use(errorHandler);

module.exports = app;
