const router = require("express").Router();
const roleController = require("../controllers/role.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Secure Role Management Workstation
router.use(authMiddleware);

router.post("/", roleController.createRole);
router.get("/", roleController.getRoles);
router.put("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

module.exports = router;
