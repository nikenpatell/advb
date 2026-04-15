const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["ORG_ADMIN", "TEAM_MEMBER", "CLIENT"],
      default: "CLIENT",
    },
    customRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    clientRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TypeRegistry",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

// Prevent a user from having multiple roles in the SAME organization concurrently in simple terms
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
membershipSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("Membership", membershipSchema);
