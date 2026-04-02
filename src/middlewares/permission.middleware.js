const Membership = require("../models/Membership.model");
const AppError = require("../utils/AppError");

/**
 * Industrial Permission Check Middleware.
 * Grants access if user is ORG_ADMIN or has specific custom role permission.
 * @param {string} module - The target registry module (e.g., TASK, CASE)
 * @param {string} action - The intended action (e.g., CREATE, VIEW)
 */
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      // 1. Super User bypass
      if (req.user.role === "ORG_ADMIN") return next();

      // 2. Resolve Workspace Identity & custom role parameters
      const membership = await Membership.findOne({
        userId: req.user.id,
        organizationId: req.user.orgId
      }).populate({



        path: 'customRoleId',
        model: 'Role'
      });

      if (!membership) {
        throw new AppError("Security Block: Workspace context not identified.", 403);
      }

      // 3. Admin escalation check (redundant but safe)
      if (membership.role === "ORG_ADMIN") return next();

      // 4. Custom Registry Permission validation
      if (!membership.customRoleId) {
        // Strict security: No custom role = No granular access
        throw new AppError("Security Block: Personnel lacks granular role assignment for this operation.", 403);
      }

      const role = membership.customRoleId;
      const perm = role.permissions.find(p => p.module === module);

      if (!perm || !perm.actions.includes(action)) {
        throw new AppError(`Registry Violation: Identity lacks '${action}' privilege for the '${module}' workstation.`, 403);
      }

      // 5. Authorization Synchronized
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = checkPermission;
