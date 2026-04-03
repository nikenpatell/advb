const express = require("express");
const router = express.Router();
const controller = require("../controllers/case.controller");
const auth = require("../middlewares/auth.middleware");

const checkPermission = require("../middlewares/permission.middleware");

// Security workstation for Litigation Portfolio
router.use(auth);

// Operational workstation mapping
router.get("/", checkPermission("CASE", "VIEW"), controller.getCases);
router.post("/", checkPermission("CASE", "CREATE"), controller.createCase);

router.get("/:id", checkPermission("CASE", "VIEW"), controller.getCaseById);
router.put("/:id", checkPermission("CASE", "UPDATE"), controller.updateCase);
router.delete("/:id", checkPermission("CASE", "DELETE"), controller.deleteCase);

router.post("/:caseId/hearings", checkPermission("CASE", "UPDATE"), controller.addHearing);
router.post("/:id/comments", checkPermission("CASE", "UPDATE"), controller.addComment);

module.exports = router;
