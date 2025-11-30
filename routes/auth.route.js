const { Router } = require("express");
const { 
    sendCode, 
  verifyCode, 
  resetPassword ,
  login,
  register
} = require("../controllers/authController");
const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);

// Password reset routes
router.post("/send-code", sendCode);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);

module.exports = router;