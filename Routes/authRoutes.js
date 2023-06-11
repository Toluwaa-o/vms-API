const express = require("express");
const router = express.Router();

const {
  login,
  signup,
  logout,
  forgottenPassword,
} = require("../Controllers/authControllers");

router.route("/login").post(login);
router.route("/signup").post(signup);
router.route("/logout").delete(logout);
router.route("/forgotten-password").patch(forgottenPassword);

module.exports = router;
