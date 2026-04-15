const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");

const hearingSchema = new mongoose.Schema(
  {
    organizationId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Organization",
       required: true,
       index: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
      index: true,
    },
    hearingDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    stage: {
      type: String, // Case stage at the time of/after this hearing
    },
    orders: {
      type: String, // Details of court orders/proceedings
      trim: true,
    },
    nextHearingDate: {
      type: Date, // Next scheduled date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "POSTPONED"],
      default: "SCHEDULED",
    },
  },
  { timestamps: true }
);

hearingSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("Hearing", hearingSchema);
