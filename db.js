const mysql = require("mysql");

exports.db = () => {
  // connect mysql
  const con = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "secondhand",
  });
  con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!!!");
  });
  return con;
};
