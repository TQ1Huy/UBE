const authMethod = require("./auth.methods");
const jwtVariable = require("../utils/jwt");
const {
  getAccounts,
  updateRefreshToken,
  registerAccount,
  changePasswordAccount,
} = require("../models/account");
const randToken = require("rand-token");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  const username = req.body.username.toLowerCase();
  const password = req.body.password.toLowerCase();
  const fullname = req.body.fullname;
  const email = req.body.email;
  // const role_id = req.body.role_id;
  const user = await getAccounts({ username });
  if (user && user.length) {
    return res.send({
      status: "error",
      mess: "Tên tài khoản đã tồn tại",
    });
  } else {
    // const createUser = await userModel.createUser(newUser);
    const createUser = await registerAccount({
      username,
      password,
      fullname,
      email,
      // role_id,
    });
    if (!createUser) {
      return res
        .status(400)
        .send("Có lỗi trong quá trình tạo tài khoản, vui lòng thử lại.");
    }
    return res.send({
      status: "success",
      username,
      password,
      fullname,
      email,
      // role_id,
    });
  }
};

exports.login = async (req, res, next) => {
  const username = req.body.username.toLowerCase() || "test";
  const password = req.body.password || "12345";
  const getUser = await getAccounts({ username });
  if (getUser && !getUser.length) {
    return res.status(401).send("Tên đăng nhập không tồn tại.");
  }
  const user = getUser && getUser[0];

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).send("Mật khẩu không chính xác.");
  }

  const dataForAccessToken = {
    username: user.username,
  };
  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET || jwtVariable.accessTokenSecret;
  const accessTokenLife =
    process.env.ACCESS_TOKEN_LIFE || jwtVariable.accessTokenLife;

  const accessToken = await authMethod.generateToken(
    dataForAccessToken,
    accessTokenSecret,
    accessTokenLife
  );
  if (!accessToken) {
    return res
      .status(401)
      .send("Đăng nhập không thành công, vui lòng thử lại.");
  }
  let refreshToken = randToken.generate(jwtVariable.refreshTokenSize); // tạo 1 refresh token ngẫu nhiên
  if (!user.refresh_token) {
    // Nếu user này chưa có refresh token thì lưu refresh token đó vào database
    await updateRefreshToken({ refreshToken, accountId: user.id });
  } else {
    // Nếu user này đã có refresh token thì lấy refresh token đó từ database
    refreshToken = user.refresh_token;
  }
  return res.send({
    msg: "Đăng nhập thành công.",
    accessToken,
    refreshToken,
    user,
  });
};

exports.refreshToken = async (req, res) => {
  const accessTokenFromHeader = req.headers.authorization;
  if (!accessTokenFromHeader) {
    return res.status(400).send("Không tìm thấy access token.");
  }

  // Lấy refresh token từ body
  const refreshTokenFromBody = req.body.refreshToken;
  if (!refreshTokenFromBody) {
    return res.status(400).send("Không tìm thấy refresh token.");
  }

  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET || jwtVariable.accessTokenSecret;
  const accessTokenLife =
    process.env.ACCESS_TOKEN_LIFE || jwtVariable.accessTokenLife;
  // Decode access token đó
  const decoded = await authMethod.decodeToken(
    accessTokenFromHeader,
    accessTokenSecret
  );

  if (!decoded) {
    return res.status(400).send("Access token không hợp lệ.");
  }
  const username = decoded.payload.username; // Lấy username từ payload

  const getUser = await getAccounts({ username });
  if (getUser && !getUser.length) {
    return res.status(401).send("User không tồn tại.");
  }

  const user = getUser && getUser[0];

  if (refreshTokenFromBody !== user.RefreshToken) {
    return res.status(400).send("Refresh token không hợp lệ.");
  }

  // Tạo access token mới
  const dataForAccessToken = {
    username,
  };

  const accessToken = await authMethod.generateToken(
    dataForAccessToken,
    accessTokenSecret,
    accessTokenLife
  );
  if (!accessToken) {
    return res
      .status(400)
      .send("Tạo access token không thành công, vui lòng thử lại.");
  }
  return res.json({
    accessToken,
  });
};

exports.changePassword = async (req, res) => {
  const accessTokenFromHeader = req.headers.authorization;
  if (!accessTokenFromHeader) {
    return res.status(400).send("Không tìm thấy access token.");
  }
  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET || jwtVariable.accessTokenSecret;
  const accessTokenLife =
    process.env.ACCESS_TOKEN_LIFE || jwtVariable.accessTokenLife;
  // Decode access token đó
  const decoded = await authMethod.decodeToken(
    accessTokenFromHeader,
    accessTokenSecret
  );

  if (!decoded) {
    return res.status(400).send("Access token không hợp lệ.");
  }

  const username = req.body.username.toLowerCase() || "test";
  const password = req.body.password || "12345";
  const newpassword = req.body.newpassword || "12345";
  const getUser = await getAccounts({ username });
  if (getUser && !getUser.length) {
    return res.status(401).send("Đã có lỗi xảy ra vui lòng thử lại!");
  }

  const user = getUser && getUser[0];
  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).send("Mật khẩu không chính xác.");
  }

  const changePassword = await changePasswordAccount({
    accountId: user.id,
    newpassword,
  });
  if (!changePassword) {
    return res
      .status(400)
      .send("Có lỗi trong quá trình đổi mật khẩu, vui lòng thử lại.");
  }
  return res.send({
    status: "success",
    username,
    newpassword,
  });
};
