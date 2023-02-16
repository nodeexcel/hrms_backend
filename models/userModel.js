
function user(database, type) {
  const {
    assignUserRole,
    generateUserToken,
    getUserInfoByWorkEmail,
    getUserInfo,
  } = require("../allFunctions");
  const { Op, QueryTypes } = require("sequelize");
  
  const User = database.define(
    "user",
    {
      username: {
        type: type.STRING,
        unique: true,
      },
      type: type.STRING,
      password: type.STRING,
      status: type.STRING,
    },
    { timestamps: false }
  );

  User.findOneUserById = async (userId) => {
    try {
      let checkUser = await User.findOne({where : { id : userId}});
      if(checkUser){
        return checkUser
      }else{
        console.log("user not found")
        return false
      }
    } catch (error) {
      console.log(error)
      throw new Error(error)
    }
  }

  User.login = async (
    username,
    password,
    models,
    forceLoginForUsername = false
  ) => {
    try {
      let error = 1;
      let message;
      let data = {};
      let login_by_email = false;
      console.log(username,password)
      let query = await models.sequelize.query(
        `select * from users where username = '${username}' and password = '${password}' AND status='Enabled' `,
        { type: QueryTypes.SELECT }
      );
      if (forceLoginForUsername != false) {
        query = await models.sequelize.query(
          `select * from users where username='${forceLoginForUsername}' AND status='Enabled' `,
          { type: QueryTypes.SELECT }
        );
      }
      const re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      let value = re.test(String(username).toLowerCase());
      let userData;
      if (value == true) {
        userData = await getUserInfoByWorkEmail(username, models);
        if ((userData.userProfile.user_Id && userData.user.password) !== "") {
          if (userData.user.password == password) {
            login_by_email = true;
          }
        }
      } else if (query.length == 0 && !login_by_email) {
        error = 1;
        message = "invalid login";
      } else {
        let userId =
          query[0].id != null ? query[0].id : userData.userProfile.user_Id;
        let userInfo = await getUserInfo(userId, models);
        console.log(userInfo,"this is userInfo", userInfo)
        if (userInfo == null) {
          message = "Invalid Login";
        } else {
          is_super_admin = false;
          if (userInfo[0].type.toLowerCase() == "admin") {
            is_super_admin = true;
          }
          if (is_super_admin == false && userInfo[0].role_id == null) {
            error = 1;
            message = "Role is not assigned.Contact Admin";
          } else {
            error = 0;
            message = "Success login";
            let jwtToken = await generateUserToken(userInfo[0].user_Id, models);
            data.token = jwtToken;
            data.userId = userInfo[0].user_Id;
          }
        }
      }
      let Return = {};
      Return.error = error;
      Return.message = message;
      Return.data = data;
      return Return;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  };

  User.getAll = async (limit, offset) => {
    try {
      let users_all = await User.findAll({ limit, offset });
      return users_all;
    } catch (error) {
      throw new Error("Unable to locate all users");
    }
  };

  User.createUser = async (reqBody, models) => {
    try {
      let error = 1;
      let message;
      let userId;
      let username = await User.findAll({
        where: { username: reqBody.username },
      });
      let workemail = await models.UserProfile.findAll({
        where: { work_email: reqBody.workemail },
      });
      let otheremail = await models.UserProfile.findAll({
        where: { other_email: reqBody.email },
      });
      if (username.length !== 0) {
        error = 1;
        message = "username exists";
      } else if (workemail.length !== 0) {
        error = 1;
        message = "workemail exists";
      } else if (otheremail.length !== 0) {
        error = 1;
        message = "personal email exists";
      } else {
        let status = "Enabled";
        let userCreation = await User.create({
          username: reqBody.username,
          password: reqBody.password,
          status: status,
          type: reqBody.type,
        });
        userId = userCreation.id;
        if (!userId) {
          error = 1;
          message = "Error occured while adding user";
        } else {
          let userProfileData = await models.UserProfile.create({
            name: reqBody.name,
            jobtitle: reqBody.jobtitle,
            dateofjoining: reqBody.dateofjoining,
            user_Id: userId,
            dob: reqBody.dob,
            gender: reqBody.gender,
            work_email: reqBody.workemail,
            training_month: reqBody.training_month,
            other_email: reqBody.email,
          });
          if (userProfileData == null) {
            let userDelete = await User.destroy({
              where: { id: userId },
            });
            error = 1;
            message = "Error in registering new.";
          } else {
            error = 0;
            message = "Registration Successfull but roles not assigned";
            let allRoles = await models.Role.findAll({});
            for (let roles in allRoles) {
              if (allRoles[roles].name == reqBody.type) {
                let defaultRoleId = allRoles[roles].id;
                if (userId && defaultRoleId !== null) {
                  let roleToAssign = await assignUserRole(
                    userId,
                    defaultRoleId,
                    models
                  );
                  error = 0;
                  message = "registeration sucessfull";
                } else {
                  error = 1;
                  message = "role not assigned";
                }
              }
            }
          }
        }
      }
      let Return = {};
      Return.error = error;
      Return.message = message;
      return Return;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  };
  User.getDisabledUsers = async () => {
    try {
      let disabledUsers = await User.findAll({ where: { status: "disabled" } });
      return disabledUsers;
    } catch (error) {
      throw new Error(error);
    }
  };

  User.changeStatus = async (reqBody) => {
    try {
      let statusToChange = await User.update(
        { status: reqBody.status },
        { where: { id: reqBody.user_id } }
      );
      if (statusToChange[0] !== 0) {
        return "updated";
      } else {
        return "not updated";
      }
    } catch (error) {
      throw new Error(error);
    }
  };
  return User;
}



module.exports = user;
