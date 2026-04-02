const express = require("express");
const router = express.Router();
const controller = require("../controllers/task.controller");
const auth = require("../middlewares/auth.middleware");

const checkPermission = require("../middlewares/permission.middleware");

// Secure all task endpoints behind authentication and organization scoping
router.use(auth);

router.get("/", checkPermission("TASK", "VIEW"), controller.getTasks);
router.post("/", checkPermission("TASK", "CREATE"), controller.createTask);
router.put("/:id", checkPermission("TASK", "UPDATE"), controller.updateTask);
router.delete("/:id", checkPermission("TASK", "DELETE"), controller.deleteTask);

module.exports = router;
