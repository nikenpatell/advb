const router = require("express").Router();
const mongoose = require("mongoose");

// Priority Litigation Registry
router.use("/cases", require("./case.routes"));

// General Operational Workstations
router.use("/auth", require("./auth.routes"));
router.use("/org", require("./org.routes"));
router.use("/team", require("./team.routes"));
router.use("/registry", require("./registry.routes"));
router.use("/roles", require("./role.routes"));
router.use("/tasks", require("./task.routes"));
router.use("/calendar", require("./calendar.routes"));
router.use("/search", require("./search.routes"));

// Comprehensive Health Check for industrial monitoring
router.get("/health", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  
  res.status(200).json({ 
    success: true, 
    message: "Systems Normal. API is operational.",
    diagnostics: {
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;

