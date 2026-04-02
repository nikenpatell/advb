const { body } = require("express-validator");

/**
 * Robust authentication schemas for enterprise-grade security.
 * Enforces high-entropy passwords as specified in the SaaS security compliance.
 */

exports.registerValidation = [
  body("name")
    .notEmpty().withMessage("Professional name is required")
    .isLength({ min: 2 }).withMessage("Name must be at least 2 characters long")
    .trim(),
  body("email")
    .isEmail().withMessage("Valid professional email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 }).withMessage("Security policy requires at least 8 password characters")
    .matches(/[A-Z]/).withMessage("Must contain at least one uppercase letter")
    .matches(/[0-9]/).withMessage("Must contain at least one numerical digit"),
];

exports.loginValidation = [
  body("email").isEmail().withMessage("Valid credentials required").normalizeEmail(),
  body("password").notEmpty().withMessage("Identity validation required"),
  body("role").notEmpty().withMessage("Context role selection is required for this identity cluster.").isIn(["ORG_ADMIN", "TEAM_MEMBER", "CLIENT"]),
];

exports.verifyOtpValidation = [
  body("email").isEmail().withMessage("Valid email context required").normalizeEmail(),
  body("otp").isLength({ min: 6, max: 6 }).withMessage("Access token must be exactly 6 digits"),
];

exports.resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset session token is missing"),
  body("password")
    .isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Must contain one uppercase")
    .matches(/[0-9]/).withMessage("Must contain one number"),
];

exports.forgotPasswordValidation = [
  body("email").isEmail().withMessage("Valid recovery target required").normalizeEmail(),
];

exports.getRolesValidation = [
  body("email").isEmail().withMessage("Valid identity email required").normalizeEmail(),
];
