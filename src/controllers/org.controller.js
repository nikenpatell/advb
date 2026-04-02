const orgService = require("../services/org.service");
const asyncHandler = require("../utils/asyncHandler");

exports.createOrg = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new Error("Organization name is required");

  // User is injected from `auth` middleware
  const org = await orgService.createOrg(req.body, req.user.id);
  res.status(201).json({ success: true, message: "Workspace created successfully", data: org });
});

exports.updateOrg = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new Error("Organization name is required");

  const org = await orgService.updateOrg(req.params.id, req.body, req.user.id);
  res.json({ success: true, message: "Workspace updated successfully", data: org });
});

exports.deleteOrg = asyncHandler(async (req, res) => {
  await orgService.deleteOrg(req.params.id, req.user.id);
  res.json({ success: true, message: "Workspace deleted successfully", data: null });
});
