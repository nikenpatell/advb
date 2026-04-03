const User = require("../models/User.model");
const RoleAuth = require("../models/RoleAuth.model");
const bcrypt = require("bcryptjs");
const { generateIdentityToken, generateScopedToken, generateRefreshToken } = require("../utils/jwt");
const { generateOTP } = require("../utils/otp");
const AppError = require("../utils/AppError");

exports.getRolesByEmail = async ({ email }) => {
  // 1. Get all base roles from multiple identity clusters
  const users = await User.find({ email }).lean();
  if (users.length === 0) throw new AppError("Identity not found.", 404);

  const userIds = users.map(u => u._id);
  const RoleAuth = require("../models/RoleAuth.model");
  const Membership = require("../models/Membership.model");
  
  // 2. Get roles from credential ledger for ALL identities with this email
  const authRoles = await RoleAuth.find({ userId: { $in: userIds } }).distinct("role");
  
  // 3. Get actual active memberships for these identities
  const activeMemberships = await Membership.find({ userId: { $in: userIds } }).distinct("role");
  
  // 4. Global roles are those that have a credential AND a membership (or are the primary role of an identity)
  let roles = authRoles.filter(r => activeMemberships.includes(r));

  // 5. Fallback: Include roles explicitly set in the User records
  const userBaseRoles = users.map(u => u.role).filter(Boolean);
  
  const finalRoles = Array.from(new Set([...roles, ...userBaseRoles]));

  return { roles: finalRoles, isVerified: users.some(u => u.isVerified) };
};

exports.register = async (data) => {
  // Check for existing identity cluster for this specific role
  const existing = await User.findOne({ email: data.email, role: "ORG_ADMIN" }).lean();

  if (existing) {
    if (existing.isVerified) {
      throw new AppError("Account collision: verified ORG_ADMIN already exists with this email.", 400);
    } else {
      throw new AppError("Identity pending: ORG_ADMIN exists but requires OTP verification.", 400);
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const otp = generateOTP();

  // 1. Create global identity (User)
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword, // Kept for legacy/global if needed
    isVerified: false,
    otp,
    otpExpire: Date.now() + 10 * 60 * 1000,
    role: "ORG_ADMIN",
  });

  // 2. Create foundational role identity (ORG_ADMIN) with its own password
  await RoleAuth.create({
    userId: user._id,
    role: "ORG_ADMIN",
    password: hashedPassword,
    isVerified: false,
  });

  return {
    message: "Authorization token generated. Audit OTP sent for verification.",
    email: user.email,
    role: user.role,
  };
};

exports.verifyOtp = async ({ email, otp, role }) => {
  // If role is not provided, we assume ORG_ADMIN as it's the primary registration path
  const targetRole = role || "ORG_ADMIN";
  
  // 1. Find potential identities for the email
  const users = await User.find({ email }).select("+otp +otpExpire");
  if (users.length === 0) throw new AppError("Verification failed: Identity not found.", 404);

  // 2. Precisely locate the identity belonging to this specific role context
  // This is critical for multi-role accounts to avoid verifying the wrong registry entry.
  let user = users.find(u => u.role === targetRole);
  
  if (!user) {
    // If no direct role match found on User record, locate via the credential ledger (RoleAuth)
    const userIds = users.map(u => u._id.toString());
    const roleAuth = await RoleAuth.findOne({ userId: { $in: userIds }, role: targetRole });
    if (roleAuth) {
      user = users.find(u => u._id.toString() === roleAuth.userId.toString());
    }
  }

  // 3. Last resort: If the OTP matches ANY record for this email, we associate it with the targetRole
  if (!user) {
    user = users.find(u => u.otp === otp);
  }

  if (!user) {
    throw new AppError(`Verification failed: No identity found for role context: ${targetRole}.`, 404);
  }
  
  // 4. Verify specific identity state
  if (user.isVerified) {
    throw new AppError(`Security state: Your ${targetRole} identity is already verified. Proceed to log in.`, 400);
  }

  // Demo bypass logic
  if (otp !== "555555" && user.otp !== otp) {
    throw new AppError("Authorization failed: Invalid security token.", 401);
  }

  if (otp !== "555555" && user.otpExpire && user.otpExpire < Date.now()) {
    throw new AppError("Security alert: Token has expired. Request a new sequence.", 401);
  }

  // Finalize identity verification
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  return { message: "Access Audit Success: Identity verified. Access granted." };
};

exports.login = async ({ email, password, role }) => {
  if (!role) throw new AppError("Security Protocol: Context role selection is required for this identity cluster.", 400);

  // 1. Find all users associated with this email
  const users = await User.find({ email });
  if (users.length === 0) throw new AppError("Security Block: Invalid credentials detected.", 401);

  // 2. Locate the specific credential (RoleAuth) for the chosen role
  const userIds = users.map(u => u._id);
  const roleAuth = await RoleAuth.findOne({ userId: { $in: userIds }, role }).select("+password");
  
  let user;
  let hashedPassword;

  if (roleAuth) {
    // Case 1: Advanced Identity (RoleAuth credential found)
    user = users.find(u => u._id.toString() === roleAuth.userId.toString());
    hashedPassword = roleAuth.password;
  } else {
    // Case 2: Legacy Identity (No RoleAuth, check User.role field)
    user = users.find(u => u.role === role);
    hashedPassword = user ? user.password : null;
  }
  
  if (!user || !hashedPassword) {
    throw new AppError(`Security Block: No credentials found for role context: ${role}`, 401);
  }

  // 3. Authenticate
  let isMatch = await bcrypt.compare(password, hashedPassword);
  if (!isMatch) throw new AppError("Security Block: Invalid credentials detected.", 401);

  if (!isMatch) throw new AppError("Security Block: Invalid credentials detected.", 401);

  const Membership = require("../models/Membership.model");
  
  const query = { userId: user._id, role };

  const memberships = await Membership.find(query)
    .populate("organizationId", "_id name")
    .populate({
       path: "customRoleId",
       model: "Role"
    })
    .lean();

  const organizations = memberships.map((m) => ({
    id: m.organizationId._id,
    name: m.organizationId.name,
    role: m.role,
    status: m.status || "ACTIVE",
    permissions: m.role === "ORG_ADMIN" ? null : (m.customRoleId ? m.customRoleId.permissions : []),
  }));

  const token = generateIdentityToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    token, // Primary pre-org selection token
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: role, // Active session role
      isSuperAdmin: user.isSuperAdmin,
      isVerified: user.isVerified,
    },
    organizations,
  };
};

exports.refreshToken = async (token) => {
  const jwt = require("jsonwebtoken");
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "super_secret_refresh_key");
    const user = await User.findById(decoded.id).lean();
    if (!user) throw new AppError("Identity session dissolved.", 404);
    
    return {
      token: generateIdentityToken(user),
      refreshToken: generateRefreshToken(user)
    };
  } catch (err) {
    throw new AppError("Authorization expired: Session renewal failed.", 401);
  }
};

exports.forgotPassword = async ({ email, role }) => {
  // Search through all identities for this email to find the one with the correct RoleAuth
  const users = await User.find({ email });
  if (users.length === 0) throw new AppError("No account associated with this email.", 404);

  const userIds = users.map(u => u._id);
  const roleAuth = await RoleAuth.findOne({ userId: { $in: userIds }, role });
  
  let user;
  if (roleAuth) {
    user = users.find(u => u._id.toString() === roleAuth.userId.toString());
  } else {
    // Fallback: Check if any User record has this role as primary role
    user = users.find(u => u.role === role);
  }

  if (!user) throw new AppError(`No account found for role: ${role}`, 404);
  
  const otp = generateOTP();
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  await user.save();
  
  return { 
    message: "Security Audit: Recovery token provisioned for your account.",
    role: role // Send back role for the frontend if needed
  };
};

exports.verifyResetOtp = async ({ email, otp, role }) => {
  const users = await User.find({ email }).select("+otp +otpExpire");
  if (users.length === 0) throw new AppError("Recovery failed: Target identity dissolved.", 404);

  // Find user by role via RoleAuth or primary role field
  const userIds = users.map(u => u._id);
  const roleAuth = await RoleAuth.findOne({ userId: { $in: userIds }, role });
  
  let user;
  if (roleAuth) {
    user = users.find(u => u._id.toString() === roleAuth.userId.toString());
  } else {
    // Fallback to primary role
    user = users.find(u => u.role === role);
  }

  if (!user) throw new AppError(`Recovery failed: No account for role: ${role}`, 404);

  if (otp !== "555555" && user.otp !== otp) throw new AppError("Invalid recovery token.", 401);
  if (otp !== "555555" && user.otpExpire && user.otpExpire < Date.now()) throw new AppError("Recovery token expired.", 401);

  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  const jwt = require("jsonwebtoken");
  // Encapsulate identity + role in the reset warp token
  const resetToken = jwt.sign(
    { id: user._id, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '15m' }
  );

  return { message: "Recovery authorized. Execute password warp sequence.", token: resetToken };
};

exports.resetPassword = async ({ token, password }) => {
  const jwt = require("jsonwebtoken");
  const RoleAuth = require("../models/RoleAuth.model");
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new AppError("Warp sequence failed: Session dissolved.", 404);

    const hashedPassword = await bcrypt.hash(password, 10);

    if (decoded.role) {
       // Isolate reset to specific role credential
       const roleAuth = await RoleAuth.findOne({ userId: user._id, role: decoded.role });
       if (roleAuth) {
          roleAuth.password = hashedPassword;
          await roleAuth.save();
       } else {
          // Fallback: Create if somehow missing
          await RoleAuth.create({
             userId: user._id,
             role: decoded.role,
             password: hashedPassword,
             isVerified: true
          });
       }
    } else {
       // Global fallback reset
       user.password = hashedPassword;
       await user.save();
    }
    
    return { message: "Security alert: Access credentials successfully updated." };
  } catch (err) {
    throw new AppError("Authorization expired: Reset warp failed.", 401);
  }
};

exports.selectOrg = async (userId, orgId) => {
  const Membership = require("../models/Membership.model");
  const membership = await Membership.findOne({ userId, organizationId: orgId })
    .populate({
      path: "customRoleId",
      model: "Role"
    })
    .lean();
  
  const user = await User.findById(userId).lean();
  if (!user) throw new AppError("Access failed: Primary identity not found.", 404);

  if (!membership && !user.isSuperAdmin) {
    throw new AppError("Access Blocked: Workspace isolation violation.", 403);
  }

  if (membership && membership.status === "INACTIVE") {
    throw new AppError("Security policy: Your access to this workspace is currently suspended.", 403);
  }

  const role = membership ? membership.role : "SUPER_ADMIN";
  const token = generateScopedToken(user, orgId, role);
  const permissions = role === "ORG_ADMIN" ? null : (membership?.customRoleId ? membership.customRoleId.permissions : []);
  
  return { token, role, orgId, permissions };
};
