const jwt = require("jsonwebtoken");
const User = require("../model/user");

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization;
  console.log("verify token: ", token);

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    const user = (
      await User.findOne({ phone: decoded.phone }).exec()
    ).toObject();
    delete user.password;
    req.user = user;
    // console.log('authorization user', req.user)
    next();
  } catch (error) {
    console.log("auth error", error);
    res.status(403).send("token invalid or expired");
  }
  // hide the password
};

module.exports = { verifyToken };
