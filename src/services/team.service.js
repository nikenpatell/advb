const User = require("../models/User.model");
const Membership = require("../models/Membership.model");
const RoleAuth = require("../models/RoleAuth.model");
const bcrypt = require("bcryptjs");
const { generateOTP } = require("../utils/otp");

exports.createMember = async (data, orgId, creatorId) => {
  const { name, email, password, contactNumber, role, customRoleId, clientRoleId } = data;
  const targetRole = role || "TEAM_MEMBER";

  // 1. Manage Global Identity (Scoped by Role)
  let user = await User.findOne({ email, role: targetRole });
  
  if (!user) {
    const hashedPassword = await bcrypt.hash(password || "Default@123", 10);
    user = await User.create({
      name,
      email,
      password: hashedPassword, // Legacy global fallback
      contactNumber,
      isVerified: false,
      role: targetRole,
    });
  }

  // 2. Manage Role-Specific Credential (The "Different Password per Role" logic)
  const existingRoleAuth = await RoleAuth.findOne({ userId: user._id, role: targetRole });
  
  const otp = generateOTP();
  if (!existingRoleAuth && password) {
    const roleHashedPassword = await bcrypt.hash(password, 10);
    await RoleAuth.create({
      userId: user._id,
      role: targetRole,
      password: roleHashedPassword,
      isVerified: false,
      otp,
      otpExpire: Date.now() + 10 * 60 * 1000,
    });
  }

  // Also set OTP on the User record for the auth service verifyOtp flow
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  await user.save();

  // 3. Map User to the specific Organization via Membership
  try {
    await Membership.create({
      userId: user._id,
      organizationId: orgId,
      role: targetRole,
      customRoleId: customRoleId || null,
      clientRoleId: clientRoleId || null,
    });
  } catch (err) {
    if (err.code !== 11000) throw err;
    // Update existing if needed
    await Membership.findOneAndUpdate(
       { userId: user._id, organizationId: orgId },
       { role: targetRole, customRoleId: customRoleId || null, clientRoleId: clientRoleId || null }
    );
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: targetRole,
    customRoleId,
    clientRoleId,
  };
};

exports.getTeamMembers = async (orgId, role) => {
  const query = { organizationId: orgId };
  if (role) query.role = role;

  const memberships = await Membership.find(query)
    .populate("userId", "name email contactNumber isVerified createdAt")
    .populate("customRoleId")
    .populate("clientRoleId", "title _id")
    .lean();

  return memberships.map((m) => ({
    id: m.userId._id,
    name: m.userId.name,
    email: m.userId.email,
    contactNumber: m.userId.contactNumber,
    isVerified: m.userId.isVerified,
    role: m.role,
    customRoleId: m.customRoleId?._id,
    customRoleName: m.customRoleId?.name,
    clientRoleId: m.clientRoleId?._id,
    clientRole: m.clientRoleId?.title,
    status: m.status,
    joinedAt: m.createdAt,
  }));
};

exports.updateMember = async (userId, orgId, data) => {
  const { name, contactNumber, role, status, customRoleId, clientRoleId } = data;
  
  const user = await User.findById(userId);
  if (!user) throw new Error("Personnel not found.");

  if (name) user.name = name;
  if (contactNumber) user.contactNumber = contactNumber;
  await user.save();

  const membership = await Membership.findOne({ userId, organizationId: orgId });
  if (!membership) throw new Error("No active membership found in this organization.");
  
  if (role) membership.role = role;
  if (status) membership.status = status;
  if (customRoleId !== undefined) membership.customRoleId = customRoleId || null;
  if (clientRoleId !== undefined) membership.clientRoleId = clientRoleId || null;
  await membership.save();

  return { 
     id: user._id, 
     name: user.name, 
     role: membership.role, 
     status: membership.status,
     customRoleId: membership.customRoleId,
     clientRoleId: membership.clientRoleId,
  };
};

exports.deleteMember = async (userId, orgId) => {
  // We only delete the mapping to THIS organization to maintain identity portability
  const result = await Membership.deleteOne({ userId, organizationId: orgId });
  if (result.deletedCount === 0) {
    throw new Error("Target personnel not found in this workspace context.");
  }
  return true;
};
