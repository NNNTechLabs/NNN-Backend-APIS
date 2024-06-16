// middleware function is just a function that has access to req/res objects
// then uses next to move on to the next middlware function

const jwt = require("jsonwebtoken");
require("dotenv").config();
const UserService = require("../service/user");
const jwtSecret = process.env.jwtSecret;

module.exports = function (req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1] || authHeader;
    if (token == null)
      return res.status(401).json({ status: false, message: "token error" });
    jwt.verify(token, jwtSecret, async (err, decode) => {
      if (err)
        return res
          .status(401)
          .json({ status: false, message: "token error invalid" });

      const user = await UserService.getUserByWallet(decode.data);
      if (user?.jwt_token != token)
        return res.status(401).json({ status: false, message: "token error" });

      req.userDetails = user;
      next();
    });
  } catch (error) {
    return res.status(401).json({ status: false, message: "token error" });
  }
};
