const express = require("express");
const controller = require("../controllers/org.controller");
const auth = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/create", auth, controller.createOrg);
router.put("/:id", auth, controller.updateOrg);
router.delete("/:id", auth, controller.deleteOrg);

module.exports = router;
