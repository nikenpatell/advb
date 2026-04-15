const mongoose = require("mongoose");

const whatsappSessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Session name is required"],
    trim: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ["CONNECTED", "QR_GENERATED", "DISCONNECTED", "AUTHENTICATED", "INITIALIZING"],
    default: "DISCONNECTED"
  },
  qrCode: {
    type: String,
    default: null
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("WhatsAppSession", whatsappSessionSchema);
