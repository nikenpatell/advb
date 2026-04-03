const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");


exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new Error("Refresh token required");
  const data = await authService.refreshToken(refreshToken);
  res.json({ success: true, message: "Token refreshed", data });
});

exports.selectOrg = asyncHandler(async (req, res) => {
  const { orgId } = req.body;
  if (!orgId) throw new Error("Organization ID is required");
  // Requires user to be authenticated with Identity Token first
  const data = await authService.selectOrg(req.user.id, orgId);
  res.json({ success: true, message: "Workspace active", data });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body);
  res.json({ success: true, message: data.message });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  res.json({ success: true, message: data.message });
});

exports.verifyResetOtp = asyncHandler(async (req, res) => {
  const data = await authService.verifyResetOtp(req.body);
  res.json({ success: true, message: data.message, data: { token: data.token } });
});

exports.register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: data.message,
    data: { 
      email: data.email,
      role: data.role
    },
  });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const data = await authService.verifyOtp(req.body);

  res.json({
    success: true,
    message: data.message,
  });
});

exports.login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);

  res.json({
    success: true,
    message: "Login successful",
    data,
  });
});

exports.getRolesByEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new Error("Email is required");
  const data = await authService.getRolesByEmail({ email });
  res.json({ success: true, data });
});

// Profile endpoint to test JWT
exports.profile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: "Profile fetched",
    data: req.user,
  });
});
