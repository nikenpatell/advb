const express = require("express");
const router = express.Router();
const controller = require("../controllers/team.controller");
const auth = require("../middlewares/auth.middleware");

const checkPermission = require("../middlewares/permission.middleware");

// All team routes require authentication and organization scoping
router.use(auth);

router.post("/create", checkPermission("TEAM", "CREATE"), controller.createMember);
router.get("/", checkPermission("TEAM", "VIEW"), controller.getTeamMembers);
router.put("/:id", checkPermission("TEAM", "UPDATE"), controller.updateMember);
router.delete("/:id", checkPermission("TEAM", "DELETE"), controller.deleteMember);

module.exports = router;
