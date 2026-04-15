const mongoose = require("mongoose");

const typeRegistrySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["CASE_TYPE", "CASE_STAGE", "PAYMENT_MODE", "DOCUMENT_TYPE", "EXPENSE_CATEGORY", "CLIENT_ROLE"],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    isLive: {
      type: Boolean,
      default: true,
    },
    isPrime: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

// Ensure unique titles within a category per organization
typeRegistrySchema.index({ organizationId: 1, category: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("TypeRegistry", typeRegistrySchema);
