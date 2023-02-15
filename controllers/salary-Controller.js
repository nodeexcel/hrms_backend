const db = require("../db");
const _ = require("lodash")
const {
  deleteUserSalary,
  getUserManagePayslipBlockWise,
  getAllUserInfo,
  createUserPayslip,
  getUserDetail,
  getSalaryDetail,
  getHoldingDetail,
  getUserPayslipInfo,
  API_updateEmployeeAllocatedLeaves,
  API_updateEmployeeFinalLeaveBalance,
  getTeamSalaryDetails,
  getTeamPermissions,
  getTeamSalaryDetailsByRoles,
} = require("../salaryFunctions");
const fs = require('fs');
const {
  getSalaryInfo
} = require("../employeeFunction");
exports.delete_salary = async (req, res, next) => {
  try {
    let resp;
    let message, error;
    if (req.body.user_id && req.body.salary_id) {
      let userid = req.body['user_id'];
      let salaryid = req.body['salary_id'];
      resp = await deleteUserSalary(userid, salaryid, db);
      message = resp.data;
      error = resp.error;
    } else {
      message = "please provide userid and salary id "
      error = 1;
    }
    res.status_code = 200;
    res.data = message;
    res.error = resp.error;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};


exports.get_user_manage_payslips_data = async (req, res, next) => {
  try {
    let resp = {};
    let year;
    if (req.body["user_id"] && req.body["user_id"] != "") {
      let loggedUserRole = "";
      let loggedUserInfo = req.userData;
      if (loggedUserInfo != false) {
        loggedUserRole = loggedUserInfo["role"];
      }
      if (loggedUserRole.toLowerCase() == "hr") {
        resp["error"] = 0;
        r_data = {};
        r_data["all_users_latest_payslip"] = {};
        resp["data"] = r_data;
      } else {
        let extra_arrear = "";
        let arrear_for_month = "";
        let userid = req.body["user_id"];
        if (req.body["year"]) {
          year = req.body["year"];
        }
        if (req.body["month"]) {
          month = req.body["month"];
        }
        if (req.body["extra_arrear"] && req.body["arrear_for_month"]) {
          extra_arrear = req.body["extra_arrear"];
          arrear_for_month = req.body["arrear_for_month"];
        }
        if (!req.body["year"] && !req.body["month"]) {
          let currentYear = new Date().getFullYear();
          let currentMonth = new Date().toLocaleString("default", {
            month: "long",
          });
          if (currentMonth == "January") {
            let date1 = new Date();
            year = new Date(date1).getFullYear() - 1;
            month = new Date(date1).getMonth();
          } else {
            year = currentYear;
            month = new Date().getMonth();
          }
        }
        // $res = Salary::getUserManagePayslip($userid, $year, $month, $extra_arrear, $arrear_for_month);
        resp = await getUserManagePayslipBlockWise(
          userid,
          year,
          month,
          extra_arrear,
          arrear_for_month,
          db,
          req
        ); /* this is added to notify employee about missing timings for days */
      }
    }
    res.status_code = 200;
    res.data = resp.data;
    res.message = resp.message;
    res.error = resp.error;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.get_user_salary_info_by_id = async (req, res, next) => {
  try {
    let loggedUserInfo = req.userData;
    let result = {};
    if (req.body.user_id != "undefined" && req.body.user_id != "") {
      let userid = req.body.user_id;
      let userinfo = await getUserDetail(userid, db);
      if (userinfo <= 0) {
        result = {
          error: 1,
          message: "The given user id member not found",
        };
      } else {
        if (loggedUserInfo.role.toLowerCase() == "hr") {
          result = {
            data: {
              message: "You are not authorise to view this user data",
            },
          };
        } else {
          result = {
            error: 0,
            data: userinfo,
          };
          let res3 = await getHoldingDetail(userid, db);
          let resData = await getSalaryInfo(userid, db);
          let hideSalaryFromHr = false;
          if (resData.length > 0) {
            for await (let salCheck of resData) {
              if (salCheck.total_salary && salCheck.salary > 20000) {
                hideSalaryFromHr = true;
              }
            }
          }
          let res4 = await getUserPayslipInfo(userid, db);
          let i = 0;
          result["data"].salary_details = [];
          for await (let val of resData) {
            let res2 = await getSalaryDetail(val.id, userid, db);
            res2.test = val;
            res2.date = val.applicable_from;
            result.data.salary_details.push(res2);
            i++;
          }
          result.data.holding_details = res3;
          result.data.payslip_history = res4;
          let joining_date = result.data.date_of_joining;
          let d = new Date();
          let current_date = `${d.getFullYear()}-${
            d.getMonth() + 1
          }-${d.getDate()}`;
          let endDate = new Date(current_date);
          let startDate = new Date(joining_date);
          let numberOfMonths = Math.abs(
            (endDate.getFullYear() - startDate.getFullYear()) * 12 +
            (endDate.getMonth() + 1 - (startDate.getMonth() + 1))
          );
        }
      }
    } else {
      result.error = 1;
      result.message = "The given user id member not found";
    }
    res.status_code = 200;
    res.data = result.data;
    res.message = result.message;
    res.error = result.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.create_employee_salary_slip = async (req, res, next) => {
  try {
    let resp = {};
    if ((req.body['user_id']) && req.body['user_id'] != "") {
      resp = await createUserPayslip(req, db);
    } else {
      resp['message'] = 'Please give user_id ';
    }
    res.status_code = 200;
    res.data = resp.data;
    res.message = resp.message;
    res.error = resp.error
    return next();
  } catch (error) {
    console.log(error)
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.get_all_users_detail = async (req, res, next) => {
  try {
    let hideSecureInfo = true;
    let loggedUserInfo = req.userData
    if ((loggedUserInfo['role']) && (loggedUserInfo['role'].toLowerCase) == 'admin') {
      hideSecureInfo = false;
    }
    let resp = await getAllUserInfo(false, hideSecureInfo, req, db);
    res.status_code = 200;
    res.data = resp.data;
    res.message = resp.message;
    res.error = resp.error
    return next();
  } catch (error) {
    console.log(error)
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
}
exports.get_user_salary_info = async (req, res, next) => {
  try {
    let user_id = req.userData.id;
    let userinfo = getUserDetail(user_id, db);
    let result = {
      error: 0,
      data: userinfo,
      salary_details: [],
    };
    let userSalaryInfo = await getSalaryInfo(user_id, db);
    let res3 = await getHoldingDetail(user_id, db);
    let res4 = await getUserPayslipInfo(user_id, db, true);
    let i = 0;
    for await (let val of userSalaryInfo) {
      let res2 = await getSalaryDetail(val.id, db);
      res2.test = val;
      res2.date = val.applicable_from;
      result.data.salary_details.push(res2);
      i++;
    }
    result.data.holding_details = res3;
    for await (let [key, payslip] of res4) {
      if (
        payslip.total_net_salary != "undefined" &&
        payslip.total_net_salary * 1 > 0
      ) {} else {
        delete res4[key];
      }
    }
    result.data.payslip_history = res4;
    res.status_code = 200;
    res.data = result;
    res.error = result.error;
    return next();
  } catch (error) {
    console.log(error)
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.update_employee_allocated_leaves = async (req, res, next) => {
  try {
    let result = await API_updateEmployeeAllocatedLeaves(req.body, db);
    res.status_code = 200;
    res.message = result.message;
    res.error = result.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.update_employee_final_leave_balance = async (req, res, next) => {
  try {
    let result = await API_updateEmployeeFinalLeaveBalance(req.body, db);
    res.status_code = 200;
    res.message = result.message;
    res.error = result.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.team_salary_details = async (req, res, next) => {
  const admins = await getTeamPermissions()
  try {
    let isSpecialUser = false;
    let data = [];
    for (admin of admins) {
      if (req.userData.username === admin.username) {
        isSpecialUser = true;
        data = await getTeamSalaryDetails(admin.teams);
        break;
      }
    }
    // if(!isSpecialUser){
    //   for (rolePage of req.userData.role_pages){
    //     if (rolePage.page_name = 'salary'){
    //       data = await getTeamSalaryDetailsByRoles(rolePage.roles);
    //     }
    //   }
    // }
    const totalSalary = [];
    let totalAllTeamSalary = 0;
    data.forEach(candidate=>{
      let isIncluded = false;
      totalSalary.every(team=>{
        if(candidate.team === team.teamName){
          isIncluded = true;
          team.totalTeamSalary += candidate.salary_info.total_salary;
          return false;
        }
        return true;
      })
      if(!isIncluded){
        totalSalary.push({teamName:candidate.team, totalTeamSalary:candidate.salary_info.total_salary});
      }
      totalAllTeamSalary += candidate.salary_info.total_salary;
    })
    totalSalary.push({totalAllTeamSalary});
    data.push(totalSalary);
    res.status_code = 200;
    res.data = data;
    return next();
  } catch (error) {
    console.log(error)
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};