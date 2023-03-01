const db = require("../db");
const providers = require("../providers/creation-provider");
const reqUser = require("../providers/error-check");
const jwt = require("jsonwebtoken");
const secret = require("../config");

// exports.getUserProfileController = async (req, res, next) => {
//   try {
//     let userProfileDetails = await  getUserDetailInfo(userid,req,db);
//     res.data = userProfileDetails;
const {
  getUserDetailInfo,
  getEnabledEmployeesBriefDetails,
  getDisabledUser,
  getUserDocumentDetail,
  getUserPolicyDocument,
  getEmployeeLifeCycle,
  updateELC,
  getTeamList,
  saveTeamList,
  UpdateUserBankInfo,
  updatePassword,
  getSalaryInfo,
  UpdateUserInfo,
  updateEmployeePassword,
  deleteRole,
  assignManagerToEmployee,
  assignemployees,
  sumOfSalary
} = require("../employeeFunction");
const { validateSecretKey } = require("../allFunctions");
const { response } = require("express");
const { User } = require("../models");

exports.getUserProfileController = async (req, res, next) => {
  try {
    let id = req.userData.id;
    // let loggeduserid=req.userData.data.id;
    let userProfileDetails = await getUserDetailInfo(id, req, db);
    res.data = userProfileDetails.data;
    res.error = userProfileDetails.error;
    res.status_code = 200;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getLifeCycleController = async (req, res, next) => {
  try {
    let employeeLifeCycle = await getEmployeeLifeCycle(req.body.userid, db);
    res.status_code = 200;
    res.data = employeeLifeCycle;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getUserProfileDetailByIdConttroller = async (req, res, next) => {
  try {
    let response;
    if (typeof req.body.user_id != "undefined" && req.body.user_id !== "") {
      user_id = req.body.user_id;
      response = await getUserDetailInfo(user_id, req, db);
      if (
        typeof req.body.secret_key != "undefined" &&
        req.body.secret_key !== ""
      ) {
        let validate_secret = await validateSecretKey(req.body.secret_key, db);
        if (validate_secret) {
          secureKeys = [
            "bank_account_num",
            "blood_group",
            "address1",
            "address2",
            "emergency_ph1",
            "emergency_ph2",
            "medical_condition",
            "dob",
            "marital_status",
            "city",
            "state",
            "zip_postal",
            "country",
            "home_ph",
            "mobile_ph",
            "work_email",
            "other_email",
            "special_instructions",
            "pan_card_num",
            "permanent_address",
            "current_address",
            "slack_id",
            "policy_document",
            "training_completion_date",
            "termination_date",
            "training_month",
            "slack_msg",
            "signature",
            "role_id",
            "role_name",
            "eth_token",
          ];
          for (let [key, r] of Object.entries(
            response.data.user_profile_detail
          )) {
            for (let securekey of securekeys) {
              if (key == securekey) {
                delete response.data.user_profile_detail.key;
              }
            }
          }
        }
      }
      res.error = response.error;
      res.data = response.data;
    } else {
      res.message = "Please give user_id ";
    }
    res.status_code = 200;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getEnabledUser = async (req, res, next) => {
  try {
    let enabledUsers = await getEnabledEmployeesBriefDetails(req, db);
    res.data = enabledUsers.data;
    res.error = enabledUsers.error;
    res.status_code = 200;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.updateLifeCycleController = async (req, res, next) => {
  try {
    let lifeCycleData = await updateELC(req.body.stepid, req.body.userid, db);
    res.status_code = 200;
    res.message = lifeCycleData.message;
    res.error = lifeCycleData.error;
    res.data = lifeCycleData.data;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getDisabledUser = async (req, res, next) => {
  try {
    //  let IS_SECRET_KEY_OPERATION =false;
    //  if(IS_SECRET_KEY_OPERATION){
    //    let loggedUserInfo=false;
    //  }
    let disabledUsers = await getDisabledUser(req, db);
    res.data = disabledUsers.data;
    res.message = disabledUsers.message;
    res.status_code = 200;
    return next();
    c;
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.addTeamController = async (req, res, next) => {
  try {
    JSON.stringify(req.body.value);
    let response = await saveTeamList(req, db);
    res.status_code = 200;
    res.data = response.data;
    res.message = response.message;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getUserPolicyDocument = async (req, res, next) => {
  try {
    let userid = req.userData.id;
    let userPolicyDocument = await getUserPolicyDocument(userid, req, db);
    res.error = userPolicyDocument.error;
    res.message = userPolicyDocument.message;
    res.data = userPolicyDocument.data;
    res.status_code = 200;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.updateUserPolicyDocument = async (req, res, next) => {
  try {
    let logged_user_id = req.userData.id;
    let updatedUserPolicyDocument =
      await db.UserProfile.updateUserPolicyDocument(req, logged_user_id);
    res.message = "updated";
    res.status_code = 200;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.uploadUserDocument = async (req, res, next) => {
  try {
    let uploadUserDocument = await db.Document.uploadUserDocument(req);
    (res.message = uploadUserDocument), (res.status_code = 200);
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getTeamListController = async (req, res, next) => {
  try {
    let response = await getTeamList(req, db);
    res.status_code = 200;
    res.data = response.data;
    res.error = response.error;
    res.message = response.message;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.updateBankDetailsController = async (req, res, next) => {
  try {
    let updatedDetails = await UpdateUserBankInfo(req, db);
    res.status_code = 200;
    res.error = updatedDetails.error;
    res.data = updatedDetails.data;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.deleteRoleController = async (req, res, next) => {
  try {
    let role_id = req.body.role_id;
    let deletedRole = await deleteRole(role_id, req, db);
    res.status_code = 200;
    res.message = deletedRole;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.changeStatusController = async (req, res, next) => {
  try {
    let changedStatus = await db.User.changeStatus(req.body);
    res.status_code = 200;
    res.message = changedStatus;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.updateUserBYIdController = async (req, res, next) => {
  try {
    let response12;
    if (typeof req.body.user_id !== undefined && req.body.user_id !== "") {
      let user_id = req.body.user_id;
      let update = true;
      let showFirstSalaryTobeAddedWarning = false;
      let tr_completion_date = req.body.training_completion_date;
      let check_sendConfirmationEmail = false;
      if (
        typeof tr_completion_date !== undefined &&
        tr_completion_date != "" &&
        tr_completion_date !== "0000-00-00"
      ) {
        let check_sendConfirmationEmail = true;
      }
      if (check_sendConfirmationEmail) {
        let sal_details = await getSalaryInfo(user_id, db);
        let sendConfirmationEmail = true;
        if (sal_details.length > 1) {
        } else {
          showFirstSalaryTobeAddedWarning = true;
        }
        if (sendConfirmationEmail) {
          req.body.sendConfirmationEmail = true;
        }
      }
      if (update) {
        response12 = await UpdateUserInfo(req, db);
        if (showFirstSalaryTobeAddedWarning) {
          response12["message_warning"] =
            "Salary is not added for this employee!!";
        }
      }
    } else {
      response12.data.message = "Please give user_id ";
    }
    res.status_code = 200;
    res.message = response12.data.message;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.updateNewPassController = async (req, res, next) => {
  try {
    let userData = req.userData;
    let updatedPassword = await updatePassword(req, userData, db);
    res.status_code = 200;
    res.error=updatedPassword.error;
    res.data = updatedPassword.data;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.updateEmployeePassControllers = async (req, res, next) => {
  try {
    let logged_user_id = req.userData.id;
    let updatedEmployeePass = await updateEmployeePassword(
      logged_user_id,
      req,
      db
    );
    res.status_code = 200;
    res.message = updatedEmployeePass;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getUserDocument = async (req, res, next) => {
  try {
    let user_id = req.userData.id;
    let userDocument = await getUserDocumentDetail(user_id, req, db);
    console.log(userDocument,12)
    res.data = userDocument.data;
    res.error = userDocument.error;
    res.status_code = 200;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.getUserDocumentById = async (req, res, next) => {
  try {
    if (typeof req.body.user_id != "undefined" && req.body.user_id !== "") {
      let user_id = req.body.user_id;
      let response = await getUserDocumentDetail(user_id, req, db);
      res.data = response.data.user_document_info;
      res.error = response.error;
      res.status_code = 200;
      return next();
    } else {
      res.status_code = 200;
      res.message = "Please give user_id ";
    }
    res.message = response.data.message;
    res.data = response;
  } catch (error) {
    console.log(error);
    return next();
  }
};

exports.getManagersEmployeesList = async (req,res,next)=>{
  try{
    const [managerDetails] = await db.sequelize.query(`SELECT DISTINCT users.* FROM users JOIN user_roles ON users.id = user_roles.user_id JOIN roles ON user_roles.role_id = roles.id WHERE roles.name = 'manager';`)
    if(!managerDetails || !managerDetails.length) return res.status(200).send([])
    // console.log(managerDetails)
    const [employeesDetails] = await db.sequelize.query(`SELECT users.*, managers.manager_id
    FROM users
    LEFT JOIN assignManagers AS managers ON users.id = managers.user_id
    WHERE users.status != 'Disabled';`);
    // if(!employeesDetails || !employeesDetails.length) return res.status(200).send([])
    managerDetails.forEach((manager,i)=>{
      managerDetails[i].employeesDetails = employeesDetails.filter(emp=>emp["manager_id"] === manager.user_id);
    })
    const unassignedEmployees = employeesDetails.filter(emp=>emp.manager_id === null);
    managerDetails.push({type:"unassigned", employeesDetails:unassignedEmployees})
    res.status(200).send(managerDetails)
  }catch(e){
    console.log(e);
    return next(e)
  }
}

exports.assign_manager_to_emp =async (req,res,next) => {
    try {
      let reqBody = req.body;
      if(reqBody.userId && reqBody.managerId){
        let userId = reqBody.userId;
        let managerId = reqBody.managerId;
        console.log(userId,managerId)
        let checkUser = await db.User.findOneUserById(userId);
        let checkManager = await db.User.findOneUserById(managerId);
        if(checkUser && checkManager){
            let response = await assignManagerToEmployee(userId,managerId,db);
            if(response){
              res.error = 0;
              res.message = response;
              res.status_code = 200;
              return next()
            }else{
              res.error = 1;
              res.message = `Something went wrong `;
              res.status_code = 200;
              return next()
            }
        }else{
          res.error = 1
          res.message = "User not Found"
          res.status_code = 200;
          return next()
        }
      }
    } catch (error) {
      console.log(error);
      return next()
    }
}

exports.assignmanager =  async(req,res,next)  => {
  try {
    let arrayOfUserId = req.body.userId;
    let managerId = req.body.managerId;
    if(managerId === ""){
      let delIds = '(';
      arrayOfUserId.forEach((id,i)=>{
        if(i === 0){
          delIds += id;
        }else{
          delIds += `,${id}`
        }
      });
      delIds+= ')'
      await db.sequelize.query(`delete from assignManagers where user_Id in ${delIds}`)
      res.error = 0;
      res.status_code = 200;
      res.message = "User Unassigned";
      return next();
    }
    if(arrayOfUserId && managerId) {
      const manager = await db.User.findByPk(managerId);
      const employees = await db.User.findAll({ where: { id: arrayOfUserId }});
    
      if (!manager) {
        res.error = 1
      res.message = `Manager with ID ${managerId} not found`
      res.status_code = 200;
      return next()
      }
      const employeeIdsNotFound = arrayOfUserId.filter(employeeId => {
        return !employees.some(employee => employee.id === employeeId);
      });
    
      if (employeeIdsNotFound.length > 0) {
        res.error = 1
      res.message = `Employees with IDs ${employeeIdsNotFound.join(',')} not found`
      res.status_code = 200;
      return next()
      }
      let delIds = '(';
      arrayOfUserId.forEach((id,i)=>{
        if(i === 0){
          delIds += id;
        }else{
          delIds += `,${id}`
        }
      });
      delIds+= ')'
      await db.sequelize.query(`delete from assignManagers where user_Id in ${delIds}`)
    
      const employeeManagerRows = arrayOfUserId.map(employeeId => ({
        user_Id: employeeId,
        manager_Id: managerId
      }));

      let response = await assignemployees(employeeManagerRows,db);
      
      if(response){
        res.error = 0;
        res.status_code = 200;
        res.message  = " User assigned";
        res.data = response 
        return next()
      }
    }else{
      res.error = 1
      res.message = "please enter all fields"
      res.status_code = 200;
      return next()
    }   
    } catch (error) {
      console.log(error)
      res.error = error
      // return next()
    }
}

exports.sumOfEmpSalaryByManager = async(req,res,next) => {
  try {
    let managerId = req.body.managerId;
    if(managerId){
      let response = await sumOfSalary(managerId,db);
      if(response){
        res.error = 0;
        res.message  = response
        res.status_code =200;
        return next()
      }else{
        res.status_code = 200;
        res.error = 1
        res.message = "contact server"
        return next()
      }
    }
    else{
      res.status_code = 200;
      res.error = 1
      res.message = "please give managerId"
      return next()
    }
  } catch (error) {
    console.log(error);
    return next()
  }
}