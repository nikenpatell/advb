const registryService = require("../services/registry.service");
const asyncHandler = require("../utils/asyncHandler");

exports.getRegistry = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const data = await registryService.getRegistryByCategory(req.user.orgId, category);
  res.json({ success: true, message: "Registry categories synchronized successfully.", data });
});

exports.createType = asyncHandler(async (req, res) => {
  const data = await registryService.createType(req.user.orgId, req.body);
  res.status(201).json({ success: true, message: "System classification successfully registered.", data });
});

exports.updateType = asyncHandler(async (req, res) => {
  const data = await registryService.updateType(req.params.id, req.user.orgId, req.body);
  res.json({ success: true, message: "System classification successfully updated.", data });
});

exports.deleteType = asyncHandler(async (req, res) => {
  await registryService.deleteType(req.params.id, req.user.orgId);
  res.json({ success: true, message: "Classification successfully decommissioned." });
});
