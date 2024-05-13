const { db } = require("../db");
const connect = db();
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

exports.getAccounts = async ({ username }) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM user WHERE username = ?";
    connect.query(sql, username, async function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

exports.registerAccount = async ({
  username,
  password,
  fullname,
  email,
  // role_id,
}) => {
  return new Promise((resolve, reject) => {
    const hashPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const newUser = {
      username: username,
      password: hashPassword,
      email: email,
      fullname: fullname,
      // role_id: role_id,
    };
    let createUser = `INSERT INTO user SET ?`;
    connect.query(createUser, newUser, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

exports.changePasswordAccount = async ({ accountId, newpassword }) => {
  return new Promise((resolve, reject) => {
    const hashPassword = bcrypt.hashSync(newpassword, SALT_ROUNDS);
    const passwordUser = {
      password: hashPassword,
    };
    const sql = "UPDATE user SET ? WHERE id = ?";

    connect.query(sql, [passwordUser, accountId], function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

exports.updateRefreshToken = async ({ refreshToken, accountId }) => {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE user SET ? WHERE id = ?";
    const newUser = {
      refresh_token: refreshToken,
    };
    connect.query(sql, [newUser, accountId], function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

exports.deleteAccount = async () => {};
