const teamService = require("../services/team.service");
const asyncHandler = require("../utils/asyncHandler");

exports.createMember = asyncHandler(async (req, res) => {
  const { name, email, password, contactNumber, role } = req.body;
  if (!name || !email || !password || !contactNumber) {
    throw new Error("Missing required fields (name, email, password, and mobile number) for identity creation.");
  }

  // Ensure current user is an Admin in an active org
  if (!req.user.orgId) {
    throw new Error("You must have an active organization context to create members.");
  }

  const data = await teamService.createMember(req.body, req.user.orgId, req.user.id);
  
  res.status(201).json({
    success: true,
    message: `${role === "CLIENT" ? "Client" : "Team member"} created successfully. Use 555555 for OTP.`,
    data: {
      id: data.id,
      name: data.name,
      email: data.email
    }
  });
});

exports.getTeamMembers = asyncHandler(async (req, res) => {
  if (!req.user.orgId) {
    throw new Error("Organization selection required.");
  }

  // Optional role filtering (TEAM_MEMBER / CLIENT)
  const role = req.query.role;
  const data = await teamService.getTeamMembers(req.user.orgId, role);
  res.json({
    success: true,
    message: "Personnel fetched successfully.",
    data
  });
});

exports.updateMember = asyncHandler(async (req, res) => {
  if (!req.user.orgId) {
    throw new Error("Unauthorized workspace access.");
  }

  const data = await teamService.updateMember(req.params.id, req.user.orgId, req.body);
  res.json({
    success: true,
    message: "Personnel information updated successfully.",
    data
  });
});

exports.deleteMember = asyncHandler(async (req, res) => {
  if (!req.user.orgId) {
    throw new Error("Unauthorized workspace access.");
  }

  await teamService.deleteMember(req.params.id, req.user.orgId);
  res.json({
    success: true,
    message: "Personnel access successfully revoked from workstation.",
  });
});
