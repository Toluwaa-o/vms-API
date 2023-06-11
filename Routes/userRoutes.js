const express = require("express");
const router = express.Router();
const { authorizeUser } = require("../Middleware/authentication");

const {
  editUser,
  getUser,
  getAllCivillians,
  getAllOfficers,
  getAllUnverified,
  deleteUser,
  showCurrentUser,
} = require("../Controllers/userControllers");

router.route("/users").get(authorizeUser("admin"), getAllCivillians);
router.route("/show-current-user").get(showCurrentUser);
router.route("/officers").get(authorizeUser("admin"), getAllOfficers);
router
  .route("/officers/unverified")
  .get(authorizeUser("admin"), getAllUnverified);
router.route("/:id").get(getUser).patch(editUser).delete(deleteUser);

module.exports = router;
