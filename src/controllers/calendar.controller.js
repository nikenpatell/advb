const calendarService = require("../services/calendar.service");
const asyncHandler = require("../utils/asyncHandler");

exports.getCalendarEvents = asyncHandler(async (req, res) => {
  if (!req.user.orgId) throw new Error("Workspace selection required for synchronization.");
  
  const data = await calendarService.getCalendarEvents(req.user.id, req.user.orgId);
  res.json({
    success: true,
    message: "Calendar workspace synchronized.",
    data
  });
});
