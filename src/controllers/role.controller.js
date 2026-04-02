const roleService = require("../services/role.service");
const asyncHandler = require("../utils/asyncHandler");

exports.createRole = asyncHandler(async (req, res) => {
  if (!req.user.orgId) throw new Error("Workspace context required for role creation.");
  
  const data = await roleService.createRole(req.user.orgId, req.body);
  res.status(201).json({
    success: true,
    message: "New organization role initialized and permissioned.",
    data
  });
});

exports.getRoles = asyncHandler(async (req, res) => {
  if (!req.user.orgId) throw new Error("Workspace context required for role listing.");
  
  const data = await roleService.getRolesByOrg(req.user.orgId);
  res.json({
    success: true,
    message: "Organization role registry synchronized.",
    data
  });
});

exports.updateRole = asyncHandler(async (req, res) => {
  if (!req.user.orgId) throw new Error("Workspace context required for role update.");
  
  const data = await roleService.updateRole(req.params.id, req.user.orgId, req.body);
  res.json({
    success: true,
    message: "Role parameters Modified.",
    data
  });
});

exports.deleteRole = asyncHandler(async (req, res) => {
  if (!req.user.orgId) throw new Error("Workspace context required for role removal.");
  
  await roleService.deleteRole(req.params.id, req.user.orgId);
  res.json({
    success: true,
    message: "Role successfully dissolved from workstation.",
  });
});
