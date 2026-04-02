const jwt = require("jsonwebtoken");

exports.generateIdentityToken = (user) => {
  return jwt.sign(
    { id: user._id, isSuperAdmin: user.isSuperAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // Short lived identity token used pre-org selection
  );
};

exports.generateScopedToken = (user, orgId, role) => {
  return jwt.sign(
    { 
      id: user._id, 
      orgId, 
      role, 
      isSuperAdmin: user.isSuperAdmin 
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" } // Session token
  );
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || "super_secret_refresh_key",
    { expiresIn: "7d" }
  );
};
