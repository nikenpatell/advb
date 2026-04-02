const router = require("express").Router();
const calendarController = require("../controllers/calendar.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Secure Calendar Workstation access
router.use(authMiddleware);

router.get("/events", calendarController.getCalendarEvents);

module.exports = router;
