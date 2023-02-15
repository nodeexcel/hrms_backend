const db = require("../db");
// const {QueryTypes} = require("sequelize");
const providers = require("../providers/creation-provider");
const reqUser = require("../providers/error-check");
const jwt = require("jsonwebtoken");
const secret = require("../config");
const md5 = require("md5");
const {
  assignUserRole,
  validateSecretKey,
  getEnabledUsersListWithoutPass,
} = require("../allFunctions");

exports.userRegister = async (req, res, next) => {
  try {
    let request_Validate = await reqUser(req);
    let user_details = await providers.validateCreation(req.body);
    let result = await db.User.createUser(req.body, db);
    req.body.user_id = result;
    const token = await jwt.sign(
      { user_id: result, email: result.email },
      secret.jwtSecret,
      { expiresIn: "2hr" }
    );
    res.token = token;
    res.status_code = 201;
    res.error = result.error;
    res.message = result.message;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.userLogin = async (req, res, next) => {
  try {
    let request_Validate = await reqUser(req);
    let username = req.body.username;
    let password = md5(req.body.password);
    let result = await db.User.login(username, password, db);
    res.status_code = 200;
    res.error = result.error;
    res.message = result.message;
    res.token = result.data.token;
    if (result.data.userId) {
      res.userId = result.data.userId.toString();
    }
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.addNewEmployeeController = async (req, res, next) => {
  try {
    let result = await db.UserProfile.addNewEmployee(req.body, db);
    res.status_code = 200;
    res.error = result.error;
    res.message = result.message;
    if (result.data.userID) {
      res.data = result.data;
    }
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.addUserRole = async (req, res, next) => {
  try {
    let request_Validate = await reqUser(req);
    let base_role_id = null;
    if (
      typeof req.body.base_role_id !== undefined &&
      req.base_role_id != null
    ) {
      base_role_id = req.body.base_role_id;
    }
    let name = req.body.name;
    let description = req.body.description;
    let role_create = await db.Role.AddNewRole(
      name,
      description,
      base_role_id,
      db
    );
    res.status_code = 201;
    res.error = role_create.error;
    res.message = role_create.message;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getUserRole = async (req, res, next) => {
  try {
    let machine_count = await db.Role.listAllRole(db);
    res.status_code = 200;
    res.data = machine_count;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.assignUserRoleController = async (req, res, next) => {
  try {
    let userid = req.body.user_id;
    let roleid = req.body.role_id;
    let result = await assignUserRole(userid, roleid, db);
    res.status_code = 200;
    res.error = result.error;
    res.message = result.message;
    return next();
  } catch (error) {
    res.status_code = 500;
    console.log(error);
    res.message = error.message;
    return next();
  }
};

exports.getEnableUser = async (req, res, next) => {
  try {
    let role;
    if (
      typeof req.body.secret_key != "undefined" &&
      req.body.secret_key != ""
    ) {
      let validate_secret = await validateSecretKey(req.body.secret_key, db);
      if (validate_secret) {
        role = "guest";
      }
    } else {
      let token = req.headers.authorization.split(" ");
      let loggedUserInfo = jwt.verify(token[1], secret.jwtSecret);
      role = loggedUserInfo.role;
    }
    let sorted_by =
      typeof req.body.sorted_by != "undefined" ? req.body.sorted_by : false;
    let result = await getEnabledUsersListWithoutPass(db, role, sorted_by, res);
    res.status_code = 200;
    res.error = 0;
    res.data = result;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.updateRoleController = async (req, res, next) => {
  try {
    let updateRole = await db.Role.updateRole(req.body, db);
    res.status_code = 200;
    res.message = updateRole;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.listAllRolesController = async (req, res, next) => {
  try {
    let listofRoles = await db.Role.getListOfRoles();
    // console.log(listofRoles);
    res.status_code = 200;
    res.data = listofRoles;
    res.message = listofRoles.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
