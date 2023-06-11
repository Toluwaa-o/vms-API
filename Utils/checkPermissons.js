const CustomErrors = require("../Errors");

const checkPermissons = (user, resourceId) => {
  if (user.userType === "admin") return;
  if (user.userId === resourceId.toString()) return;

  throw new CustomErrors.UnauthenticatedError(
    "User is not authorized to perform this action"
  );
};

module.exports = checkPermissons;
