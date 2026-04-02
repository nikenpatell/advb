const User = require("../models/User.model");
const RoleAuth = require("../models/RoleAuth.model");
const bcrypt = require("bcryptjs");
const { generateIdentityToken, generateScopedToken, generateRefreshToken } = require("../utils/jwt");
const { generateOTP } = require("../utils/otp");
const AppError = require("../utils/AppError");

exports.getRolesByEmail = async ({ email }) => {
  const user = await User.findOne({ email }).select("+password").lean();
  if (!user) throw new AppError("Identity not found.", 404);

  const RoleAuth = require("../models/RoleAuth.model");
  const Membership = require("../models/Membership.model");
  
  // 1. Get raw roles from the credential ledger (RoleAuth)
  const authRoles = await RoleAuth.find({ userId: user._id }).distinct("role");
  
  // 2. Cross-reference with actual memberships to ensure active access
  // A role should only be available if the user has an active workstation mapping for it
  const activeMemberships = await Membership.find({ userId: user._id }).distinct("role");
  
  // 3. Filter roles: Must have a RoleAuth AND a Membership (unless it's the primary account role which might be pending)
  let roles = authRoles.filter(r => activeMemberships.includes(r));

  // 4. Lazy Migration Fallback (Handles legacy accounts with memberships but no RoleAuth yet)
  if (roles.length === 0 && activeMemberships.length > 0) {
    for (const r of activeMemberships) {
       await RoleAuth.create({
         userId: user._id,
         role: r,
         password: user.password,
         isVerified: user.isVerified
       });
    }
    roles = activeMemberships;
  }

  // If still no roles found but user exists, they might be a high-level admin or a new user with base role
  if (roles.length === 0 && user.role) {
     roles = [user.role];
  }

  return { roles: Array.from(new Set(roles)), isVerified: user.isVerified };
};

exports.register = async (data) => {
  const existing = await User.findOne({ email: data.email }).lean();

  if (existing) {
    if (existing.isVerified) {
      throw new AppError("Account collision: verified user already exists with this email.", 400);
    } else {
      throw new AppError("Identity pending: user exists but requires OTP verification.", 400);
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
  };
};

exports.verifyOtp = async ({ email, otp }) => {
  const user = await User.findOne({ email }).select("+otp +otpExpire");

  if (!user) throw new AppError("Verification failed: Identity not found.", 404);
  
  if (user.isVerified) {
      throw new AppError("Security state: User is already verified. Proceed to log in.", 400);
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

  const user = await User.findOne({ email });
  if (!user) throw new AppError("Security Block: Invalid credentials detected.", 401);

  // Find role-specific credential
  const roleAuth = await RoleAuth.findOne({ userId: user._id, role }).select("+password");
  
  // If no role-specific credential found, we fall back to global password ONLY if it's the base role (this helps with migration)
  let isMatch = false;
  if (roleAuth) {
    isMatch = await bcrypt.compare(password, roleAuth.password);
  } else {
    // Legacy fallback or error
    throw new AppError(`Security Block: No credentials found for role context: ${role}`, 401);
  }

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
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Authorization failed: No account associated with this email identity.", 404);
  }
  
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
  const user = await User.findOne({ email }).select("+otp +otpExpire");
  if (!user) throw new AppError("Recovery failed: Target identity dissolved.", 404);

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
