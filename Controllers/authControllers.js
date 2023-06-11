const User = require("../Models/userModel");
const CustomError = require("../Errors");
const { attachCookies } = require("../Utils/JWT");

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.NotFoundError(`Invalid login credentials`);
  }

  const isCorrect = await user.comparePasswords(password);

  if (!isCorrect) {
    throw new CustomError.UnauthenticatedError("Incorrect password");
  }

  // const { firstName, lastName, userType, contact, address, email } = user
  // const token = user.generateToken()
  await attachCookies({
    res,
    user: {
      userId: user._id,
      userType: user.userType,
      verified: user.verified,
    },
  });
  return res.status(200).json({ user });
};

const signup = async (req, res) => {
  const { firstName, lastName, password, email } = req.body;
  if (!firstName || !lastName || !password || !email)
    throw new CustomError.BadRequestError(
      "Please provide all the neccessary information"
    );

  const isFirst = (await User.countDocuments()) < 1;
  if (isFirst) req.body.userType = "admin";

  req.body.verified = req.body.userType === "officer" ? false : true;

  const user = await User.create(req.body);
  await attachCookies({
    res,
    user: {
      userId: user._id,
      userType: user.userType,
      verified: user.verified,
    },
  });

  res.status(201).json({ user });
};

const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    signed: true,
    sameSite: "none",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now()),
  });

  res.status(200).json({ msg: "Logged out " });
};

const forgottenPassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    throw new CustomError.UnauthenticatedError("Invalid login credentials");

  const isCorrectPassword = await user.comparePasswords(oldPassword);

  if (!isCorrectPassword)
    throw new CustomError.UnauthenticatedError("Incorrect password");

  user.password = newPassword;

  await user.save();
  res.status(200).json({ user });
};

module.exports = { login, signup, logout, forgottenPassword };
