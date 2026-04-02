const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    permissions: [
      {
        module: { type: String, required: true }, // e.g., "TASK", "CASE", "CLIENT"
        feature: { type: String, required: true }, // e.g., "Task Management", "Litigation Portfolio"
        actions: { 
          type: [String], 
          enum: ["CREATE", "UPDATE", "DELETE", "VIEW", "APPROVE", "PRINT"],
          default: ["VIEW"]
        },
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate role names in the same organization context
roleSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Role", roleSchema);
