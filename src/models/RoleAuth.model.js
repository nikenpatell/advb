const mongoose = require("mongoose");

const roleAuthSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["ORG_ADMIN", "TEAM_MEMBER", "CLIENT"],
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return by default
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // We can store role-specific OTPs here too if needed
    otp: { type: String, select: false },
    otpExpire: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique credential per user-role pair
roleAuthSchema.index({ userId: 1, role: 1 }, { unique: true });

module.exports = mongoose.model("RoleAuth", roleAuthSchema);
