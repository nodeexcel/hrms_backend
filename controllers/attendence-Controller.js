const db = require("../db");
const { _ } = require("lodash");
const { getUserMonthAttendaceComplete } = require("../leavesFunctions");
const {
  getAllUserPrevMonthTime,
  updateDayWorkingHours,
  multipleAddUserWorkingHours,
  getWorkingHoursSummary,
  addUserWorkingHours,
  geManagedUserWorkingHours,
  getEmployeeCurrentMonthFirstWorkingDate,
  insertUserInOutTimeOfDay,
  addManualAttendance,
  API_getUserTimeSheet,
  API_userTimeSheetEntry,
  API_submitUserTimeSheet,
  API_pendingTimeSheets,
  API_getUserSubmittedTimesheet,
  API_updateUserTimeSheetStatus,
  API_updateUserFullTimeSheetStatus,
} = require("../attendaceFunctions");

exports.month_attendance = async (req, res, next) => {
  try {
    let userid = req.body["userid"];
    let year = req.body["year"];
    let month = req.body["month"];
    let response = await getUserMonthAttendaceComplete(userid, year, month, db);
    res.status_code = 200;
    res.data = response;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error;
    return next();
  }
};
exports.get_all_user_previous_month_time = async (req, res, next) => {
  try {
    let year = req.body["year"];
    let month = req.body["month"];
    let resp = await getAllUserPrevMonthTime(year, month, db);
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    res.message = resp.message;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error;
    return next();
  }
};

exports.get_user_timesheet = async (req, res, next) => {
  try {
    let userid = false;
    let d = new Date();
    let date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    let from_date = date;
    if (!_.isEmpty(req.body.user_id)) {
      userid = req.body.user_id;
      from_date =
        req.body.from_date != "undefined" ? req.body.from_date : from_date;
      let result = await API_getUserTimeSheet(userid, from_date, db);
      res.status_code = 200;
      res.error = result.error;
      res.data = result.data;
    } else {
      res.status_code = 401;
      res.message = "Please enter user id";
    }
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.update_day_working_hours = async (req, res, next) => {
  try {
    let date = req.body["date"];
    let time = req.body["time"];
    let resp = await updateDayWorkingHours(date, time, db);
    console.log(112);
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    res.message = resp.message;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error;
    return next();
  }
};
exports.user_timesheet_entry = async (req, res, next) => {
  try {
    let result = await API_userTimeSheetEntry(req.body, db);
    res.status_code = 200;
    res.error = result.error;
    res.message = result.message;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.multiple_add_user_working_hours = async (req, res, next) => {
  try {
    let resp = await multipleAddUserWorkingHours(req, db);
    console.log(resp);
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    res.message = resp.message;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error;
    return next();
  }
};
exports.working_hours_summary = async (req, res, next) => {
  try {
    let year = req.body["year"];
    let month = req.body["month"];
    let resp = await getWorkingHoursSummary(year, month, db);
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    res.message = resp.message;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error;
    return next();
  }
};
exports.add_user_working_hours = async (req, res, next) => {
  try {
    let resp;
    let userid = req.body["userid"];
    let date = req.body["date"];
    let working_hours = req.body["working_hours"];
    let reason = req.body["reason"];
    if (req.body["pending_id"]) {
      let userNextWorkingDate = await getEmployeeCurrentMonthFirstWorkingDate(
        userid,
        db
      );
      date = userNextWorkingDate["full_date"];
      reason = "Previous month pending time merged!!";
      resp = await addUserWorkingHours(
        userid,
        date,
        working_hours,
        reason,
        db,
        req.body["pending_id"]
      );
    } else {
      resp = await addUserWorkingHours(userid, date, working_hours, reason, db);
    }
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    res.message = resp.message;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error;
    return next();
  }
};
exports.get_managed_user_working_hours = async (req, res, next) => {
  try {
    let userid = req.body["userid"];
    let resp = await geManagedUserWorkingHours(userid, db);
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    res.message = resp.message;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error;
    return next();
  }
};
let getMonday = async (d) => {
  d = new Date(d);
  let day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

exports.submit_timesheet = async (req, res, next) => {
  try {
    let userid = false;
    let d = await getMonday(new Date());
    let monday = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    monday = req.body.from_date != "undefined" ? req.body.from_date : monday;
    if (!_.isEmpty(req.body.user_id)) {
      userid = req.body.user_id;
      let result = await API_submitUserTimeSheet(userid, monday, db);
      res.status_code = 200;
      res.error = result.error;
      res.message = result.message;
    } else {
      res.status_code = 403;
      res.error = 1;
      res.message = "please give user id";
    }
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.get_user_submitted_timesheet = async (req, res, next) => {
  try {
    let d = await getMonday(new Date());
    let monday = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    monday = req.body.from_date != "undefined" ? req.body.from_date : monday;
    if (!_.isEmpty(req.body.user_id)) {
      let userid = req.body.user_id;
      let result = await API_getUserSubmittedTimesheet(userid, monday, db);
      res.status_code = 200;
      res.error = result.error;
      res.message = result.message;
      res.data = result.data;
    } else {
      res.status_code = 400;
      res.error = 1;
      res.message = "please give user id";
    }
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.pending_timesheets_per_month = async (req, res, next) => {
  try {
    let y = new Date();
    let year = req.body.year != "undefined" ? req.body.year : y.getFullYear();
    let month = req.body.month != "undefined" ? req.body.month : y.getMonth();
    let result = await API_pendingTimeSheets(year, month, db);
    res.status_code = 200;
    res.error = result.error;
    res.data = result.data;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.update_user_day_summary = async (req, res, next) => {
  try {
    let userid = req.body["userid"];
    let date = req.body["date"];
    let entry_time = req.body["entry_time"];
    let exit_time = req.body["exit_time"];
    let reason = req.body["reason"];
    let resp = await insertUserInOutTimeOfDay(
      userid,
      date,
      entry_time,
      exit_time,
      reason,
      db,
      req
    );
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    res.message = resp.message;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error;
    return next();
  }
};
exports.update_user_timesheet_status = async (req, res, next) => {
  try {
    let userid = false;
    if (!_.isEmpty(req.body.user_id) && !_.isEmpty(req.body.date)) {
      let userid = req.body.user_id;
      let date = req.body.date;
      let status = req.body.status;
      let result = await API_updateUserTimeSheetStatus(
        userid,
        date,
        status,
        db
      );
      res.status_code = 200;
      res.error = result.error;
      res.data = result.data;
    } else {
      res.status_code = 400;
      res.error = 1;
      res.message = "Please enter user id and date";
    }
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.add_manual_attendance = async (req, res, next) => {
  try {
    console.log(1212);
    let user_id = req.userData["id"];
    let reason = req.body["reason"];
    let date = req.body["date"];
    let resMessageEntry = "";
    let resMessageExit = "";
    let resMessage = "";
    let resp = {};
    if (
      req.body["entry_time"] == "undefined" &&
      req.body["entry_time"] == "undefined" &&
      req.body["exit_time"] == "undefined" &&
      req.body["exit_time"] == "undefined"
    ) {
      let manual_time = [];
      manual_time["entry_time"] = req.body["entry_time"];
      manual_time["exit_time"] = req.body["exit_time"];

      resMessage = await addManualAttendance(
        user_id,
        "entry and exit",
        date,
        manual_time,
        reason,
        db
      );
    } else {
      resMessage = "Please select both entry and exit time.";
    }
    resp["error"] = 0;
    resp["message"] = resMessage;
    resp["data"] = {};
    res.status_code = 200;
    res.data = resp.data;
    res.error = resp.error;
    res.message = resp.message;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error;
    return next();
  }
};
exports.update_user_full_timesheet_status = async (req, res, next) => {
  try {
    if (!_.isEmpty(req.body.user_id) && !_.isEmpty(req.body.from_date)) {
      let userid = req.body.user_id;
      let status = req.body.status;
      let d = await getMonday(new Date());
      let monday = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      let result = await API_updateUserFullTimeSheetStatus(
        userid,
        monday,
        status,
        db
      );
      res.status_code = 200;
      res.error = result.error;
      res.data = result.data;
    } else {
      res.status_code = 400;
      res.error = 1;
      res.message = "Please give user id and a from date";
    }
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
