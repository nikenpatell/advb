const mongoose = require("mongoose");

const whatsappAuthSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  key: {
    type: String,
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
  }
}, {
  timestamps: true
});

// Composite index for fast lookups within a session
whatsappAuthSchema.index({ sessionId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("WhatsAppAuth", whatsappAuthSchema);
