const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");

const caseSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    caseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    caseType: {
      type: String, // Value from TypeRegistry category CASE_TYPE
      required: true,
    },
    caseDate: {
      type: Date,
      required: true,
    },
    courtName: {
      type: String,
      required: true,
      trim: true,
    },
    stage: {
      type: String, // Value from TypeRegistry category CASE_STAGE
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    nextHearingDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED", "PENDING"],
      default: "OPEN",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    history: [
      {
        action: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
        details: String,
      },
    ],
  },
  { timestamps: true }
);

// Unique index for caseNumber within organization context
caseSchema.index({ organizationId: 1, caseNumber: 1 }, { unique: true });
caseSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("Case", caseSchema);
