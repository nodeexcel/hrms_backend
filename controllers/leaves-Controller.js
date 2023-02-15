const db = require("../db");
const{_getPreviousMonth,getEmployeeLastPresentDay,API_deleteHoliday,addHoliday,API_getHolidayTypesList,API_getYearHolidays,cancelAppliedLeave,applyLeave,API_getAllEmployeesRHStats
    ,API_getMyRHLeaves,leaveDocRequest,updateLeaveStatus,getDaysBetweenLeaves,getAllUsersPendingLeavesSummary,getAllLeaves,API_getEmployeeRHStats,getMyLeaves}=require("../leavesFunctions")
const{_}=require("lodash")
exports.adminUserApplyLeave = async (req, res, next) => {
  try {
    let result;
    let from_date,
      to_date,
      no_of_days,
      reason,
      day_status = "";
    let leave_type,
      late_reason = "";
    let doc_link = "N/A";
    let rh_dates = false;
    let userid = req.body.user_id;
    if (req.body.from_date) {
      from_date = req.body.from_date;
    }
    if (req.body.to_date) {
      to_date = req.body.to_date;
    }
    if (req.body.no_of_days) {
      no_of_days = req.body.no_of_days;
    }
    if (req.body.reason) {
      reason = req.body.reason;
    }
    if (req.body.day_status) {
      day_status = req.body.day_status;
    }
    if ((req.body.doc_link && req.body.doc_link) != "") {
      doc_link = req.body.doc_link;
    }
    if (req.body.reason) {
      leave_type = req.body.leave_type;
    }
    if (req.body.reason) {
      late_reason = req.body.late_reason;
    }
    if (req.body.rh_dates) {
      rh_dates = req.body.rh_dates;
    }
    if (req.body.reason) {
      late_reason = req.body.late_reason;
    }
    if (req.body.rh_dates) {
      rh_dates = req.body.rh_dates;
    }
    if (req.body.pending_id) {
      let date = new Date();
      let currentDateDate = date.getDate();
      let currentMonth = date.getMonth() + 1;
      let currentYear = date.getFullYear();
      let currentDate = `${currentYear}-${currentMonth}-${currentDateDate}`;
      let previousMonth = await _getPreviousMonth(currentDate);
      reason = "Previous month pending time is applied as leave!!";
      if (from_date == "") {
        let employeeLastPresentDay = await getEmployeeLastPresentDay(
          userid,
          previousMonth.year,
          previousMonth.month,
          db
        );
        from_date = employeeLastPresentDay["full_date"];
        to_date = employeeLastPresentDay["full_date"];
      }
      result = await applyLeave(
        userid,
        from_date,
        to_date,
        no_of_days,
        reason,
        day_status,
        (leave_type = ""),
        (late_reason = ""),
        req.body["pending_id"],
        doc_link,
        rh_dates,db
      );
    } else {
      result = await applyLeave(
        userid,
        from_date,
        to_date,
        no_of_days,
        reason,
        day_status,
        leave_type,
        late_reason,
        "",
        doc_link,
        rh_dates,db
      );
    }
    res.status_code = 200;
    res.message = result;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.delete_holiday = async (req, res, next) => {
  try {
    let id = req.body["holiday_id"];
    let resp = await API_deleteHoliday(id, db);
    res.status_code = 200;
    res.error = resp.error;
    res.message = resp.data;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.add_holiday = async (req, res, next) => {
  try {
    let date = req.body["holiday_date"];
    let name = req.body["holiday_name"];
    let type = req.body["holiday_type"];
    let resp = await addHoliday(name, date, type, db);
    res.status_code = 200;
    res.message = resp.data;
    res.error = resp.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.get_holiday_types_list = async (req, res, next) => {
  try {
    resp = await API_getHolidayTypesList(db);
    res.status_code = 200;
    res.message = resp.data;
    res.error = resp.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.get_holidays_list = async (req, res, next) => {
  try {
    let year = req.body["year"];
    let resp = await API_getYearHolidays(year, db);
    res.status_code = 200;
    res.message = resp.data.message;
    res.data = resp.data.holidays;
    res.error = resp.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.cancel_applied_leave = async (req, res, next) => {
  try {
    let resp = {};
    if (req.body["user_id"] && req.body["user_id"] != "") {
      resp = await cancelAppliedLeave(req, db);
    } else {
      resp.data = {};
      resp["data"]["message"] = "Please give user_id ";
    }
    res.status_code = 200;
    res.data = resp;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.get_my_rh_leaves = async (req, res, next) => {
  try {
    let year = req.body.year;
    let userid = req.body.user_id;
    let resp = await API_getMyRHLeaves(userid, year, db);
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.send_request_for_doc = async (req, res, next) => {
  try {
    let leaveid = req.body["leaveid"];
    let doc_request = req.body["doc_request"];
    let comment = req.body["comment"];
    let resp = await leaveDocRequest(leaveid, doc_request, comment, db);
    res.status_code = 200;
    res.data = resp;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.change_leave_status = async (req, res, next) => {
  try {
    let leaveid = req.body["leaveid"];
    let newstatus = req.body["newstatus"];
    let messagetouser = req.body["messagetouser"];
    let resp = await updateLeaveStatus(
      leaveid,
      newstatus,
      messagetouser,
      db,
      req
    );
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.get_days_between_leaves = async (req, res, next) => {
  try {
    let start_date = req.body["start_date"];
    let end_date = req.body["end_date"];
    let resp = await getDaysBetweenLeaves(start_date, end_date, db);
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.get_all_leaves_summary = async (req, res, next) => {
  try {
    let year = req.body.year;
    let month = req.body.month;
    let resp = await getAllUsersPendingLeavesSummary(year, month, db, req);
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.get_all_leaves = async (req, res, next) => {
  try {
    let resp = await getAllLeaves(req, db);
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.get_user_rh_stats = async (req, res, next) => {
  try {
    let resp = {};
    if (!req.body["user_id"] || req.body["user_id"] == "") {
      resp.error = 1;
      resp.data.message = "User id not found";
    } else {
      let userid = req.body["user_id"];
      let year = req.body["year"];
      resp = await API_getEmployeeRHStats(userid, year, db);
    }
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
exports.get_my_leaves = async (req, res, next) => {
  try {
    let resp = {};
    //   if (slack_id != "") {
    //     let loggedUserInfo =await getUserInfofromSlack(slack_id);
    // }
    let loggedUserInfo = req.userData;
    if (loggedUserInfo["id"]) {
      let userid = loggedUserInfo["id"];
      resp = await getMyLeaves(userid, db);
    } else {
      resp["error"] = 1;
      // resp['data']['message'] = "userid not found";
    }
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
}
exports.get_all_users_rh_stats=async(req,res,next)=>{
  try{
    let year = req.body['year'];
    let resp =await API_getAllEmployeesRHStats(year,db);
      res.status_code=200;
      res.data=resp.data
      res.error=resp.error;
      return next();
}catch(error){
    console.log(error)
    res.status_code = 500;
    res.message = error.message;
    return next()
}
}

exports.get_my_leaves=async(req,res,next)=>{
  try{
    let resp={};
//   if (slack_id != "") {
//     let loggedUserInfo =await getUserInfofromSlack(slack_id);
// }
let loggedUserInfo=req.userData;
if (loggedUserInfo['id']) {
    let userid = loggedUserInfo['id'];
    resp =await getMyLeaves(userid,db);
} else {
    resp['error'] = 1;
    // resp['data']['message'] = "userid not found";
}
res.status_code=200;
res.data=resp.data
res.error=resp.error;
return next();
}catch(error){
  console.log(error)
  res.status_code = 500;
  res.message = error.message;
  return next();
}
}
exports.apply_leave=async(req,res,next)=>{
  try {
    let resp={};
  //   if (slack_id != "") {
  //     loggedUserInfo = await getUserInfofromSlack(slack_id);
  // }
  let loggedUserInfo=req.userData;
  // console.log(!_.isSet(loggedUserInfo['id']))
  if ((loggedUserInfo['id'])) {
   let userid =loggedUserInfo['id'];
   let from_date =req.body['from_date'];
   let to_date =req.body['to_date'];
   let no_of_days =req.body['no_of_days'];
   let reason =req.body['reason'];
   let day_status =req.body['day_status'];
   let leave_type =req.body['leave_type'];
   let late_reason =req.body['late_reason'];
   let rh_dates =req.body['rh_dates'];
   let doc_link = "N/A";
    if((req.body['doc_link']) && req.body['doc_link'] != "" ){
        doc_link = req.body['doc_link'];
    }    
    resp = await applyLeave(userid, from_date, to_date, no_of_days, reason, day_status, leave_type, late_reason, '', doc_link, rh_dates,db);
} else {
    resp['error'] = 1;
    resp['data']['message'] = "userid not found";
}
console.log(resp)
  res.status_code=200;
  res.data=resp.data
  res.error=resp.error;
  return next();
  } catch (error) {
  console.log(error)
  res.status_code = 500;
  res.message = error.message;
  return next();
  }
}