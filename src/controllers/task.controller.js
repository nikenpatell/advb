const taskService = require("../services/task.service");
const asyncHandler = require("../utils/asyncHandler");

exports.getTasks = asyncHandler(async (req, res) => {
  const data = await taskService.getTasks(req.user.id, req.user.orgId);
  res.json({ success: true, message: "Workspace tasks synchronized.", data });
});

exports.createTask = asyncHandler(async (req, res) => {
  const data = await taskService.createTask(req.user.id, req.user.orgId, req.body);
  res.status(201).json({ success: true, message: "New initiative assigned and registered.", data });
});

exports.updateTask = asyncHandler(async (req, res) => {
  const data = await taskService.updateTask(req.params.id, req.user.id, req.user.orgId, req.body);
  res.json({ success: true, message: "Task lifecycle status updated.", data });
});

exports.deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user.id, req.user.orgId);
  res.json({ success: true, message: "Initiative dissolved and removed from registry." });
});
