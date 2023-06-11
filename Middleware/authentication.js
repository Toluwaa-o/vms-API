const CustomErrors = require("../Errors");
const { isTokenValid } = require("../Utils/JWT");

const auth = async (req, res, next) => {
  const { token } = req.signedCookies;

  if (!token)
    throw new CustomErrors.UnauthenticatedError("Authentication Invalid");

  try {
    const isValid = await isTokenValid(token);
    req.user = {
      userId: isValid.userId,
      userType: isValid.userType,
      verified: isValid.verified,
    };

    next();
  } catch (error) {
    throw new CustomErrors.UnauthenticatedError("Authentication Invalid");
  }
};

const authorizeUser = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType))
      throw new CustomErrors.UnauthenticatedError(
        "User is not authorized to access this route"
      );

    next();
  };
};

module.exports = { auth, authorizeUser };
