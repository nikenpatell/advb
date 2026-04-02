const router = require("express").Router();

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

// Basic Health Check for industrial monitoring
router.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Systems Normal. API is running smoothly." });
});

module.exports = router;
