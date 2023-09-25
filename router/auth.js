const {
  login,
  adminLogin,
  validateStudent,
} = require("../controller/auth.controller");
const { verifyToken } = require("../middleware/verifyToken");

const router = require("express").Router();

router.post("/login", login);
router.post("/admin/login", adminLogin);
router.get("/validate", verifyToken, validateStudent);

module.exports = router;
