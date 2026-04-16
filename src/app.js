const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const routes = require("./routes");
const connectDB = require("./utils/db");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

/**
 * Mid-tier DB Connection Middleware.
 * Since Vercel uses serverless functions, we must ensure 
 * the database is connected before processing any requests.
 */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Infrastructure Failure: Unable to connect to database.",
      details: process.env.NODE_ENV === "development" ? error.message : null
    });
  }
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * High-Performance Security & Response Optimization.
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://advf-production.up.railway.app",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : "*",
    credentials: true,
  })
);
app.use(helmet());
app.use(compression()); 

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); 
}

// Global API Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, // Generous limit for high-interaction workstations
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Security Block: Too many requests. Please wait." }
});

app.use("/api", globalLimiter);

/**
 * Industrial Route Registry.
 * Providing helpful indices for workstation discovery.
 */

// Root Health & Metadata
app.get("/", (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "Advocate Portfolio Systems API - Online", 
    version: "1.0.0",
    status: "Stable"
  });
});

// API Root Index
app.get("/api", (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "Primary API Gateway v1", 
    available_endpoints: ["/auth", "/cases", "/team", "/registry", "/calendar", "/tasks", "/health"]
  });
});

// Primary Workstation Routing
app.use("/api", routes);

/**
 * Industrial Fall-through Handling.
 * Catch-all for undefined resource requests.
 */
app.use("*", (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Resource path '${req.originalUrl}' not found on this server.` 
  });
});

// Integrated Error Handlers
app.use(errorHandler);

module.exports = app;

