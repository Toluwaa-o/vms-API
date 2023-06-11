const jwt = require("jsonwebtoken");

const createJWT = async (tokenUser) => {
  const token = jwt.sign(tokenUser, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });

  return token;
};

const isTokenValid = async (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachCookies = async ({ res, user }) => {
  const token = await createJWT(user);
  const aDay = 1000 * 60 * 60 * 24;

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + aDay),
    secure: process.env.NODE_ENV === "production",
    signed: true,
    sameSite: "none",
  });
};

module.exports = { attachCookies, isTokenValid };
