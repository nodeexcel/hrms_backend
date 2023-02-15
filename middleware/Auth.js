const secret = require("../config");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { QueryTypes } = require("sequelize");

exports.AuthForAdmin = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      message: "Auth token missing in header",
    });
  }
  let token = req.headers.authorization.split(" ");
  try {
    const checkJwt = jwt.verify(token[1], secret.jwtSecret);
    const user = await db.sequelize.query(
      `select * from users where users.id = ${checkJwt.id}`,
      { type: QueryTypes.SELECT }
    );
    if (user[0].type.toLowerCase() == "admin") {
      req.userData = checkJwt;
      next();
    } else {
      res.send("you are not authorized");
    }
  } catch (error) {
    return res.status(401).json({
      message: "Auth token invalid",
    });
  }
};

exports.AuthForHrAdmin = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      message: "Auth token missing in header",
    });
  }
  let token = req.headers.authorization.split(" ");
  try {
    const checkJwt = jwt.verify(token[1], secret.jwtSecret);

    const user = await db.sequelize.query(
      `select * from users where users.id = ${checkJwt.id}`,
      { type: QueryTypes.SELECT }
    );
    if (
      user[0].type.toLowerCase() == "hr" ||
      user[0].type.toLowerCase() == "admin"
    ) {
      req.userData = checkJwt;
      next();
    } else {
      res.send("you are not authorized");
    }
  } catch (error) {
    return res.status(401).json({
      message: "Auth token invalid",
    });
  }
};

exports.AuthForEmployee = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      message: "Auth token missing in header",
    });
  }
  let token = req.headers.authorization.split(" ");
  try {
    const checkJwt = jwt.verify(token[1], secret.jwtSecret);
    const user = await db.sequelize.query(
      `select * from users where users.id = ${checkJwt.id}`,
      { type: QueryTypes.SELECT }
    );
    if (user[0].type == "Employee") {
      req.userData = checkJwt;
      next();
    } else {
      res.send("you are not authorized");
    }
  } catch (error) {
    return res.status(401).json({
      message: "Auth token invalid",
    });
  }
};
exports.AuthForHr = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      message: "Auth token missing in header",
    });
  }
  let token = req.headers.authorization.split(" ");
  try {
    const checkJwt = jwt.verify(token[1], secret.jwtSecret);
    const user = await db.sequelize.query(
      `select * from users where users.id = ${checkJwt.id}`,
      { type: QueryTypes.SELECT }
    );
    if (user[0].type.toLowerCase() == "hr") {
      req.userData = checkJwt;
      next();
    } else {
      res.send("you are not authorized");
    }
  } catch (error) {
    return res.status(401).json({
      message: "Auth token invalid",
    });
  }
};

exports.AuthForHrEmployee = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      message: "Auth token missing in header",
    });
  }
  let token = req.headers.authorization.split(" ");
  try {
    const checkJwt = jwt.verify(token[1], secret.jwtSecret);
    const user = await db.sequelize.query(
      `select * from users where users.id = ${checkJwt.id}`,
      { type: QueryTypes.SELECT }
    );

    if (
      user[0].type.toLowerCase() == "hr" ||
      user[0].type.toLowerCase() == "admin" ||
      user[0].type == "Employee"
    ) {
      req.userData = checkJwt;
      next();
    } else {
      res.send("you are not authorized");
    }
  } catch (error) {
    return res.status(401).json({
      message: "Auth token invalid",
    });
  }
};

exports.AuthForMangers = async (req, res, next) =>{
  if (!req.headers.authorization) {
    return res.status(401).json({
      message: "Auth token missing in header",
    });
  }
  let token = req.headers.authorization.split(" ");
  try {
    const checkJwt = jwt.verify(token[1], secret.jwtSecret);
    const user = await db.sequelize.query(
      `select * from users where users.id = ${checkJwt.id}`,
      { type: QueryTypes.SELECT }
    );
    if (
      user[0].type.toLowerCase() == "hr" ||
      user[0].type.toLowerCase() == "admin" ||
      user[0].type.toLowerCase() == "manager"
    ) {
      req.userData = checkJwt;
      next();
    } else {
      res.send("you are not authorized");
    }
  } catch (error) {
    
  }
}

