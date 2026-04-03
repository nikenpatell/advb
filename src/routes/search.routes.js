const router = require("express").Router();
const controller = require("../controllers/search.controller");
const auth = require("../middlewares/auth.middleware");

router.get("/", auth, controller.globalSearch);

module.exports = router;
