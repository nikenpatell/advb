const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["ORG_ADMIN", "TEAM_MEMBER", "CLIENT", "SUPER_ADMIN"],
      default: "CLIENT",
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false, // Prevents OTP from being leaked in regular find() queries
    },
    otpExpire: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Apply lean virtuals plugin for performance boosts on .lean()
userSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("User", userSchema);
