const express = require("express");
const router = express.Router();
const whatsappController = require("../controllers/whatsapp.controller");
const auth = require("../middlewares/auth.middleware");

router.use(auth); // Secure these endpoints

router.get("/sessions", whatsappController.getSessions);
router.post("/sessions", whatsappController.createSession);
router.post("/sessions/:id/disconnect", whatsappController.disconnectSession);
router.post("/sessions/:id/resume", whatsappController.resumeSession);
router.delete("/sessions/:id", whatsappController.deleteSession);

module.exports = router;
