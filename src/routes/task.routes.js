const express = require("express");
const router = express.Router();
const controller = require("../controllers/task.controller");
const auth = require("../middlewares/auth.middleware");

const checkPermission = require("../middlewares/permission.middleware");

// Secure all task endpoints behind authentication and organization scoping
router.use(auth);

router.get("/", checkPermission("TASK", "VIEW"), controller.getTasks);
router.get("/:id", checkPermission("TASK", "VIEW"), controller.getTaskById);
router.post("/", checkPermission("TASK", "CREATE"), controller.createTask);
router.put("/:id", checkPermission("TASK", "UPDATE"), controller.updateTask);
router.delete("/:id", checkPermission("TASK", "DELETE"), controller.deleteTask);
router.post("/:id/comments", checkPermission("TASK", "UPDATE"), controller.addComment);

module.exports = router;
