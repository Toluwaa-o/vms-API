const CustomErrors = require("../Errors");
const User = require("../Models/userModel");
const checkPermissions = require("../Utils/checkPermissons");

const getAllCivillians = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const users = await User.find({ userType: "civilian" })
    .select("-password")
    .skip(skip)
    .limit(limit);

  if (!users || users.length < 1)
    throw new CustomErrors.NotFoundError("No users found");
  const totalUsers = await User.countDocuments({ userType: "civilian" });
  const numOfPages = Math.ceil(totalUsers / limit);
  res.status(200).json({ users, totalUsers, numOfPages });
};

const getAllOfficers = async (req, res) => {
  const { search } = req.query;

  const page = Number(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  let queryObject = { userType: "officer", verified: true };
  if (search) queryObject.firstName = { $regex: search, $options: "i" };

  const users = await User.find(queryObject)
    .select("-password")
    .skip(skip)
    .limit(limit);

  if (!users || users.length < 1)
    throw new CustomErrors.NotFoundError("No users found");

  const totalUsers = await User.countDocuments({
    userType: "officer",
    verified: true,
  });
  const numOfPages = Math.ceil(totalUsers / limit);
  res.status(200).json({ users, totalUsers, numOfPages });
};

const getAllUnverified = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const users = await User.find({ userType: "officer", verified: false })
    .select("-password")
    .skip(skip)
    .limit(limit);

  if (!users || users.length < 1)
    throw new CustomErrors.NotFoundError("No users found");

  const totalUsers = await User.countDocuments({
    userType: "officer",
    verified: false,
  });
  const numOfPages = Math.ceil(totalUsers / limit);
  res.status(200).json({ users, totalUsers, numOfPages });
};

const editUser = async (req, res) => {
  const { id: userId } = req.params;
  const user = await User.findOne({ _id: userId }).select("-password");

  if (!user)
    throw new CustomErrors.NotFoundError(`No user found with id ${userId}`);

  checkPermissions(req.user, user._id);

  await user.updateOne(req.body, { new: true, runValidators: true });
  res.status(200).json({ user });
};

const getUser = async (req, res) => {
  const { id: userId } = req.params;

  const user = await User.findOne({ _id: userId }).select("-password");

  if (!user)
    throw new CustomErrors.NotFoundError(`No user found with id ${userId}`);
  checkPermissions(req.user, user._id);

  res.status(200).json({ user });
};

const deleteUser = async (req, res) => {
  const { id: userId } = req.params;

  const user = await User.findOne({ _id: userId });
  if (!user)
    throw new CustomErrors.NotFoundError(`No user found with id ${userId}`);

  checkPermissions(req.user, user._id);
  await user.deleteOne();
  res.status(200).json({ msg: "User succcessfully deleted" });
};

const showCurrentUser = async (req, res) => {
  if (!req.user)
    throw new CustomErrors.UnauthenticatedError(
      "User unauthorized to access this route"
    );

  res
    .status(200)
    .json({ user: { userId: req.user.userId, userType: req.user.userType } });
};

module.exports = {
  editUser,
  getUser,
  getAllCivillians,
  getAllOfficers,
  getAllUnverified,
  deleteUser,
  showCurrentUser,
};
