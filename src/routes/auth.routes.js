const router = require("express").Router();
const controller = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const auth = require("../middlewares/auth.middleware");

const {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  getRolesValidation
} = require("../validations/auth.validation");

/**
 * Secure Authentication endpoints for Multi-tenant SaaS.
 * All POST requests are strictly validated before service execution.
 */

// Registration flow
router.post("/register", registerValidation, validate, controller.register);
router.post("/verify-otp", verifyOtpValidation, validate, controller.verifyOtp);

// Standard login
router.post("/login", loginValidation, validate, controller.login);

// Identiy Context Discovery (Role check before login)
router.post("/get-roles-by-email", getRolesValidation, validate, controller.getRolesByEmail);

// Tokens and Password reset
router.post("/refresh", controller.refreshToken);
router.post("/select-org", auth, controller.selectOrg);

router.post("/forgot-password", forgotPasswordValidation, validate, controller.forgotPassword);
router.post("/verify-reset-otp", verifyOtpValidation, validate, controller.verifyResetOtp);
router.post("/reset-password", resetPasswordValidation, validate, controller.resetPassword);

// Scoped Profile Content
router.get("/profile", auth, controller.profile);

module.exports = router;
