const whatsappService = require("../services/whatsapp.service");
const WhatsAppSession = require("../models/WhatsAppSession.model");
const { v4: uuidv4 } = require("uuid"); // Assume uuid is installed or I'll install it

const getSessions = async (req, res) => {
  try {
    const sessions = await WhatsAppSession.find({ organizationId: req.user.orgId });
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSession = async (req, res) => {
  try {
    const { name } = req.body;
    const sessionId = `wa_${Date.now()}`;
    
    // Initialize session in background
    whatsappService.initSession(sessionId, req.user.orgId, name);

    res.status(201).json({ 
      success: true, 
      message: "Session initialization started. Watch for updates.",
      data: { sessionId, name }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const disconnectSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await WhatsAppSession.findById(id);
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    await whatsappService.disconnectSession(session.sessionId);
    res.status(200).json({ success: true, message: "Session disconnected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resumeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await WhatsAppSession.findById(id);
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    whatsappService.initSession(session.sessionId, session.organizationId, session.name);
    res.status(200).json({ success: true, message: "Resumption sequence protocol active." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await WhatsAppSession.findById(id);
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    await whatsappService.deleteSession(session.sessionId);
    res.status(200).json({ success: true, message: "Session purged from registry." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSessions,
  createSession,
  disconnectSession,
  resumeSession,
  deleteSession
};
