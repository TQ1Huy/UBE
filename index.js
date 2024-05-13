const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");
const { db } = require("./db");
const moment = require("moment");
let config = require("config");
const port = process.env.PORT || 8000;
const app = express();

const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;
const router = require("./auth/auth.routes");
app.use(cors());

const con = db();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app
  .route("/products")
  .get(function (req, res) {
    let sql = "SELECT * FROM product";
    con.query(sql, (err, response) => {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({ status: "success", data: response });
      }
    });
  })
  .post(function (req, res) {
    let sql = "insert into product set ?";
    const { body } = req;
    con.query(sql, body, function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: { ...body, id: response.insertId },
        });
      }
    });
  });
app.route("/products/:id").put(function (req, res) {
  let sql = "UPDATE product set ? where id = ?";
  let { body } = req;
  let { id } = req.params;
  con.query(sql, [body, id], function (err, response) {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({
        status: "success",
        data: body,
      });
    }
  });
});

app.route("/products/find").get(function (req, res) {
  let sql =
    "SELECT * FROM product   WHERE productName LIKE '%?%' OR loai LIKE '%?%';";
  let { key } = req.params;
  con.query(sql, key, key, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});

app.route("/hot-products").get(function (req, res) {
  let sql =
    "SELECT *,id as newid FROM product ORDER BY discount DESC limit 12;";
  con.query(sql, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});
app.route("/favorite-product/:userId").get(function (req, res) {
  let { userId } = req.params;
  // console.log(userId);
  let sql =
    "SELECT *,product_id as newid  FROM product  INNER JOIN favorite ON product.id = favorite.product_id  WHERE favorite.user_id = ?;";
  con.query(sql, userId, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});
app.route("/favorite/:userId").get(function (req, res) {
  let { userId } = req.params;
  // console.log(userId);
  let sql = "SELECT *  FROM favorite WHERE favorite.user_id = ?;";
  con.query(sql, userId, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});

app.route("/dien-thoai").get(function (req, res) {
  let sql = "SELECT * FROM product where loai='dt' limit 8 ";
  con.query(sql, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});
app.route("/product/:id").get(function (req, res) {
  let { id } = req.params;
  let sql = "SELECT * FROM product where id=?";
  con.query(sql, id, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});
app.route("/productbyid/:id").get(function (req, res) {
  let { id } = req.params;
  let sql = "SELECT * FROM product where id=?";
  con.query(sql, id, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});
app.route("/addFavoriteItem").post(function (req, res) {
  let { body } = req;
  // console.log(body);
  let sql =
    "INSERT INTO secondhand.favorite (`product_id`, `user_id`) VALUES (?, ?);";
  con.query(sql, [body.productId, body.userId], (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});
app
  .route("/deleteFavoriteItem/userId=:userId&productId=:productId")
  .delete(function (req, res) {
    let sql = "DELETE FROM favorite WHERE product_id=? and user_id=?;";
    let body = req.params;
    // console.log(body);
    con.query(sql, [body.productId, body.userId], function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
        });
      }
    });
  });

app.post("/create_payment_url", function (req, res, next) {
  process.env.TZ = "Asia/Ho_Chi_Minh";

  let date = new Date();
  let createDate = moment(date).format("YYYYMMDDHHmmss");

  let ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let tmnCode = config.get("vnp_TmnCode");
  let secretKey = config.get("vnp_HashSecret");
  let vnpUrl = config.get("vnp_Url");
  let returnUrl = config.get("vnp_ReturnUrl");
  let orderId = req.body.ordercode;
  let amount = req.body.amount;
  let bankCode = req.body.bankCode;

  let locale = req.body.language;
  if (locale === null || locale === "") {
    locale = "vn";
  }
  let currCode = "VND";
  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = currCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  if (bankCode !== null && bankCode !== "") {
    vnp_Params["vnp_BankCode"] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);

  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require("crypto");
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;
  vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

  res.send(vnpUrl);
});

app.get("/vnpay_return", function (req, res, next) {
  var vnp_Params = req.query;
  var secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];
  vnp_Params = sortObject(vnp_Params);
  var config = require("config");
  var tmnCode = config.get("vnp_TmnCode");
  var secretKey = config.get("vnp_HashSecret");
  var querystring = require("qs");
  var signData = querystring.stringify(vnp_Params, { encode: false });
  var crypto = require("crypto");
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  if (secureHash === signed) {
    //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

    res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
  } else {
    res.render("success", { code: "97" });
  }
});
// Vui lòng tham khảo thêm tại code demo
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
app.route("/order_details").post(function (req, res) {
  let sql = "insert into secondhand.order_details set ?";
  const { body } = req;
  con.query(sql, body, function (err, response) {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({
        status: "success",
        data: { ...body, id: response.insertId },
      });
    }
  });
});
app
  .route("/order")
  .get(function (req, res) {
    let sql = "SELECT * FROM secondhand.order";
    con.query(sql, (err, response) => {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({ status: "success", data: response });
      }
    });
  })
  .post(function (req, res) {
    let sql = "insert into secondhand.order set ?";
    const { body } = req;
    con.query(sql, body, function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: { ...body, id: response.insertId },
        });
      }
    });
  });
app.route("/order").get(function (req, res) {
  let sql = "SELECT * FROM secondhand.order";
  con.query(sql, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});
app.route("/order/:orderId").get(function (req, res) {
  let sql = "UPDATE secondhand.order set ? WHERE ordercode = ? ";
  const { orderId } = req.params;
  con.query(sql, orderId, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});
app
  .route("/order/:id")
  .put(function (req, res) {
    let sql = "UPDATE secondhand.order set ? WHERE id = ? ";
    const { id } = req.params;
    const { body } = req;
    con.query(sql, [body, id], (err, response) => {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({ status: "success", data: response });
      }
    });
  })
  .delete(function (req, res) {
    let sql = "DELETE FROM secondhand.order WHERE id=?";
    let { id } = req.params;
    con.query(sql, id, function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: id,
        });
      }
    });
  });
app
  .route("/category")
  .get(function (req, res) {
    let sql = "SELECT * FROM category";
    con.query(sql, (err, response) => {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({ status: "success", data: response });
      }
    });
  })
  .post(function (req, res) {
    let sql = "INSERT INTO category set ? ";
    let { body } = req;
    con.query(sql, body, function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: { ...body, id: response.insertId },
        });
      }
    });
  });
app
  .route("/category/:idcategory")
  .put(function (req, res) {
    let sql = "UPDATE category set ? where idcategory = ?";
    let { body } = req;
    let { idcategory } = req.params;
    con.query(sql, [body, idcategory], function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: body,
        });
      }
    });
  })
  .delete(function (req, res) {
    let sql = "DELETE FROM category WHERE idcategory=?";
    let { idcategory } = req.params;
    con.query(sql, idcategory, function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: idcategory,
        });
      }
    });
  });

//--------------------------- slider
app
  .route("/slider")
  .get(function (req, res) {
    let sql = "SELECT * FROM slider";
    con.query(sql, (err, response) => {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({ status: "success", data: response });
      }
    });
  })
  .post(function (req, res) {
    let sql = "insert into slider set ?";
    const { body } = req;
    con.query(sql, body, function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: { ...body, id: response.insertId },
        });
      }
    });
  });
app
  .route("/slider/:id")
  .put(function (req, res) {
    let sql = "UPDATE slider set ? where id = ?";
    let { body } = req;
    let { id } = req.params;
    con.query(sql, [body, id], function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: body,
        });
      }
    });
  })
  .delete(function (req, res) {
    let sql = "DELETE FROM slider WHERE id = ?";
    let { id } = req.params;
    con.query(sql, id, function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: id,
        });
      }
    });
  });
// --------------------------- user
app
  .route("/user")
  .get(function (req, res) {
    let sql = "SELECT * FROM user";
    con.query(sql, (err, response) => {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({ status: "success", data: response });
      }
    });
  })
  .post(function (req, res) {
    let sql = "insert into user set ?";
    const { body } = req;
    con.query(sql, body, function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: { ...body, id: response.insertId },
        });
      }
    });
  });
app
  .route("/user/:id")
  .put(function (req, res) {
    let sql = "UPDATE user set ? where id = ?";
    let { body } = req;
    body.password = bcrypt.hashSync(body.password, SALT_ROUNDS);
    let { id } = req.params;
    con.query(sql, [body, id], function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: body,
        });
      }
    });
  })
  .delete(function (req, res) {
    let sql = "DELETE FROM user WHERE id = ?";
    let { id } = req.params;
    con.query(sql, id, function (err, response) {
      if (err) {
        res.send({ status: "error", message: err });
      } else {
        res.send({
          status: "success",
          data: id,
        });
      }
    });
  });
app.route("/analysis").get(function (req, res) {
  let sql =
    "SELECT COUNT(od.status) AS total_orders, od.status FROM secondhand.order od GROUP BY od.status;";
  con.query(sql, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});
app.route("/analysis1").get(function (req, res) {
  let sql = "call secondhand.revenue();";
  con.query(sql, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response[0] });
    }
  });
});
/// comment
app.route("/comments/:id").post(function (req, res) {
  let sql = "insert into commet set ?";
  const { productId } = req.params;
  const { comment } = req;
  con.query(sql, body, function (err, response) {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({
        status: "success",
        data: { ...body, id: response.insertId },
      });
    }
  });
});
app.route("/comments/:id").get(function (req, res) {
  let sql =
    "SELECT user.username, secondhand.comment.comment FROM user JOIN secondhand.comment ON user.id = secondhand.comment.user_id where secondhand.comment.product_id= ?;";
  let { id } = req.params;
  con.query(sql, id, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});
app.route("/comments/:id");
///////////////
app.route("/category-product/:slug").get(function (req, res) {
  let sql =
    "SELECT * FROM product JOIN category ON product.loai = category.idcategory WHERE category.slug = ?;";
  let { slug } = req.params;
  con.query(sql, slug, (err, response) => {
    if (err) {
      res.send({ status: "error", message: err });
    } else {
      res.send({ status: "success", data: response });
    }
  });
});
app.use("", router);
app.listen(port);
console.log("Server started at http://localhost:" + port);
