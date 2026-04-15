const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const WhatsAppSession = require('../models/WhatsAppSession.model');
const Organization = require('../models/Organization.model');

class WhatsAppService {
  constructor() {
    this.clients = new Map();
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  async initialize() {
    try {
      console.log('[WA]: System initializing - Resuming active sessions');
      const sessions = await WhatsAppSession.find();
      for (const session of sessions) {
        // Stagger session initialization to prevent CPU/FS spikes
        this.initSession(session.sessionId, session.organizationId, session.name);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error('[WA]: Initialization failed:', err.message);
    }
  }

  async initSession(sessionId, organizationId, name) {
    if (this.clients.has(sessionId)) {
      console.log(`[WA]: Session ${sessionId} already active.`);
      return;
    }

    console.log(`[WA]: Spawning client for session: ${sessionId}`);
    
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: sessionId }),
      puppeteer: {
        headless: true,
        executablePath: fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') 
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')
            ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
            : undefined,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-software-rasterizer'
        ]
      }
    });

    this.clients.set(sessionId, client);

    client.on('qr', async (qr) => {
      const qrDataURL = await qrcode.toDataURL(qr);
      await WhatsAppSession.findOneAndUpdate(
        { sessionId },
        { status: 'QR_GENERATED', qrCode: qrDataURL, organizationId, name },
        { upsert: true }
      );
      this.broadcastUpdate(sessionId);
    });

    client.on('ready', async () => {
      console.log(`[WA]: Session ${sessionId} is READY`);
      await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'CONNECTED', qrCode: null });
      this.broadcastUpdate(sessionId);
    });

    client.on('authenticated', () => {
      console.log(`[WA]: Session ${sessionId} AUTHENTICATED`);
    });

    client.on('auth_failure', async (msg) => {
      console.error(`[WA]: Session ${sessionId} AUTH FAILURE:`, msg);
      await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'DISCONNECTED', qrCode: null });
      this.broadcastUpdate(sessionId);
    });

    client.on('disconnected', async (reason) => {
      console.log(`[WA]: Session ${sessionId} DISCONNECTED:`, reason);
      await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'DISCONNECTED', qrCode: null });
      this.broadcastUpdate(sessionId);
      this.clients.delete(sessionId);
    });

    try {
      await client.initialize();
    } catch (err) {
      console.error(`[WA]: Failed to initialize client ${sessionId}:`, err.message);
      this.clients.delete(sessionId);
    }
  }

  async broadcastUpdate(sessionId) {
    if (this.io) {
      const session = await WhatsAppSession.findOne({ sessionId });
      if (session) {
        this.io.emit('whatsapp_session_update', session);
      }
    }
  }

  async disconnectSession(sessionId) {
    const client = this.clients.get(sessionId);
    if (client) {
      try {
        await client.logout();
      } catch (err) {
        console.error(`[WA]: Logout failed for ${sessionId}, forcing destroy:`, err.message);
        await client.destroy();
      }
      this.clients.delete(sessionId);
    }
    await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'DISCONNECTED', qrCode: null });
    this.broadcastUpdate(sessionId);
  }

  async deleteSession(sessionId) {
    await this.disconnectSession(sessionId);
    await WhatsAppSession.findOneAndDelete({ sessionId });
    
    // Cleanup LocalAuth folder
    const sessionPath = path.join(process.cwd(), '.wwebjs_auth', `session-${sessionId}`);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
  }

  async sendTextMessage(organizationId, toNumber, message) {
    try {
      const activeSession = await WhatsAppSession.findOne({ 
        organizationId: organizationId, 
        status: "CONNECTED" 
      });

      if (!activeSession) {
        console.log(`[WA]: No active WhatsApp session for organization ${organizationId}`);
        return false;
      }

      const client = this.clients.get(activeSession.sessionId);
      if (!client) {
        console.log(`[WA]: Client not found in memory for session ${activeSession.sessionId}`);
        this.initSession(activeSession.sessionId, activeSession.organizationId, activeSession.name);
        return false;
      }

      const digits = toNumber.replace(/\D/g, "");
      let jid = digits;
      if (jid.length === 10) jid = "91" + jid;
      jid += "@c.us"; // whatsapp-web.js uses @c.us suffix

      await client.sendMessage(jid, message);
      console.log(`[WA]: Message delivered to ${jid} via ${activeSession.sessionId}`);
      return true;
    } catch (err) {
      console.error("[WA]: Message delivery failed:", err.message);
      return false;
    }
  }
}

module.exports = new WhatsAppService();
