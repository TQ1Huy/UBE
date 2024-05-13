const { getAccounts } = require("../models/account");
const authMethod = require("./auth.methods");
const jwtVariable = require("../utils/jwt");
exports.isAuth = async (req, res, next) => {
  // Lấy access token từ header
  const accessTokenFromHeader = req.headers.authorization;
  if (!accessTokenFromHeader) {
    return res.status(401).send("Không tìm thấy access token!");
  }

  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET || jwtVariable.accessTokenSecret;

  const verified = await authMethod.verifyToken(
    accessTokenFromHeader,
    accessTokenSecret
  );
  if (!verified) {
    return res.status(401).send("Token hết hạn!");
  }

  // const user = await userModle.getUser(verified.payload.username);
  const getUser = await getAccounts({ username: verified.payload.username });
  const user = getUser && getUser[0];
  req.user = user;

  return next();
};
