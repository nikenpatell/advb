const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach full user payload to request
    
    // Multi-tenancy: Attach correct active organization ID from headers
    if (req.headers["x-org-id"]) {
      req.user.orgId = req.headers["x-org-id"];
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid or expired token",
    });
  }
};
