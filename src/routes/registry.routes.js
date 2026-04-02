const express = require("express");
const router = express.Router();
const controller = require("../controllers/registry.controller");
const auth = require("../middlewares/auth.middleware");

const checkPermission = require("../middlewares/permission.middleware");

// Secure all registry endpoints behind authentication and organization scoping
router.use(auth);

router.get("/:category", checkPermission("REGISTRY", "VIEW"), controller.getRegistry);
router.post("/", checkPermission("REGISTRY", "CREATE"), controller.createType);
router.put("/:id", checkPermission("REGISTRY", "UPDATE"), controller.updateType);
router.delete("/:id", checkPermission("REGISTRY", "DELETE"), controller.deleteType);

module.exports = router;
