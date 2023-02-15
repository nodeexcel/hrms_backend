const jwt = require("jsonwebtoken");
const _ = require("lodash");
const secret = require("./config.json");
const { Op, QueryTypes, json } = require("sequelize");
const db = require("./db");
const { sequelize } = require("./db");
const user = require("./models/userModel");
const { Query } = require("pg");
// const { object } = require("webidl-conversions");
// const leapYear = require('leap-year');
const e = require("express");
const { getUserInfo } = require("./allFunctions");
const {
  getEmployeeCompleteInformation,
  getEnabledUsersList,
} = require("./employeeFunction");
// const{getUserMonthAttendaceComplete}=require("./attendaceFunctions")
const { query } = require("express");
const { inArray } = require("./settingsFunction");

let _getPreviousMonth = async (year, month) => {
  let previousMonthDate = new Date(year + "-" + month + "-" + 01);
  previousMonth = {};
  previousMonth["year"] = previousMonthDate.getFullYear();
  previousMonth["month"] = previousMonthDate.getMonth();
  previousMonth["monthName"] = previousMonthDate.toLocaleString("default", {
    month: "long",
  });
  return previousMonth;
};

let getEmployeeLastPresentDay = async (userid, year, month, db) => {
  let Return = false;
  let monthDetails = await getUserMonthAttendace(userid, year, month, db);
  monthDetails = monthDetails.reverse();
  for (let [k, md] of monthDetails) {
    if (md["day_type"] == "WORKING_DAY" && (md["in_time"] || md["out_time"])) {
      Return = md;
      break;
    }
  }
  return Return;
};
let getUserMonthAttendace = async (userid, year, month, db) => {
  let genericMonthDays = await getGenericMonthSummary(year, month, userid, db); // $userid added on 5jan2018 by arun so as to use user working hours
  let userMonthPunching = await getUserMonthPunching(userid, year, month, db);
  let userMonthLeaves = await getUserMonthLeaves(userid, year, month, db);

  if (userMonthLeaves.length > 0) {
    let raw_userMonthLeaves = userMonthLeaves;
    userMonthLeaves = [];
    for (let [k, v] of Object.entries(raw_userMonthLeaves)) {
      v_status = v["status"];
      if (
        v_status.toLowerCase() == "pending" ||
        v_status.toLowerCase() == "approved"
      ) {
        userMonthLeaves[k] = v;
      }
    }
  }

  let Return = [];
  for (let [k, v] of Object.entries(genericMonthDays)) {
    if (k in userMonthPunching) {
      v["in_time"] = userMonthPunching[k]["in_time"];
      v["out_time"] = userMonthPunching[k]["out_time"];
      v["total_time"] = userMonthPunching[k]["total_time"];
      v["extra_time_status"] = userMonthPunching[k]["extra_time_status"];
      v["extra_time"] = userMonthPunching[k]["extra_time"];
      v["orignal_total_time"] = userMonthPunching[k]["orignal_total_time"];
      v["seconds_actual_working_time"] =
        userMonthPunching[k]["seconds_actual_working_time"];
      v["seconds_actual_worked_time"] =
        userMonthPunching[k]["seconds_actual_worked_time"];
      v["seconds_extra_time"] = userMonthPunching[k]["seconds_extra_time"];
      v["office_time_inside"] = userMonthPunching[k]["office_time_inside"];
      Return[k] = v;
    } else {
      Return[k] = v;
    }
  }
  for (let [k, v] of Object.entries(Return)) {
    if (k in userMonthLeaves) {
      leave_number_of_days = userMonthLeaves[k]["no_of_days"];
      if (leave_number_of_days < 1) {
        // this means less then 1 day leave like half day
        v["day_type"] = "HALF_DAY";
        v["day_text"] = userMonthLeaves[k]["reason"];
        v["office_working_hours"] = "04:30";
        v["orignal_total_time"] = v["orignal_total_time"] / 2;
        v["leave_type"] = userMonthLeaves[k]["leave_type"].toLowerCase();
        v["leave_status"] = userMonthLeaves[k]["status"].toLowerCase();
      } else {
        v["day_type"] = "LEAVE_DAY";
        if (
          userMonthLeaves[k]["leave_type"].toLowerCase() == "restricted" ||
          userMonthLeaves[k]["leave_type"].toLowerCase() == "rh compensation"
        ) {
          v["day_type"] = "RH";
        }
        v["day_text"] = userMonthLeaves[k]["reason"];
        v["leave_type"] = userMonthLeaves[k]["leave_type"].toLowerCase();
        v["leave_status"] = userMonthLeaves[k]["status"].toLowerCase();
      }
      Return[k] = v;
    } else {
      Return[k] = v;
    }
  }
  for (let [k, r] of Object.entries(Return)) {
    if (r["day_type"] == "WORKING_DAY") {
      if (r["in_time"] == "" || r["out_time"] == "") {
        r["admin_alert"] = 1;
        r["admin_alert_message"] = "In/Out Time Missing";
      }
      Return[k] = r;
    }
  }
  let finalReturn = [];
  for (let [k, r] of Object.entries(Return)) {
    finalReturn.push(r);
  }
  return finalReturn;
};

let getGenericMonthSummary = async (year, month, userid = false, db) => {
  // DEFAULT_WORKING_HOURS = $_ENV['DEFAULT_WORKING_HOURS'] ? $_ENV['DEFAULT_WORKING_HOURS'] : "09:00";
  let DEFAULT_WORKING_HOURS = "9:00";
  let daysOfMonth = await getDaysOfMonth(year, month, db);
  for (let [kk, pp] of Object.entries(daysOfMonth)) {
    daysOfMonth[kk]["office_working_hours"] = DEFAULT_WORKING_HOURS;
  }
  let holidaysOfMonth = await getHolidaysOfMonth(year, month, db);
  let weekendsOfMonth = await getWeekendsOfMonth(year, month, db); //done
  let nonworkingdayasWorking = await getNonworkingdayAsWorking(year, month, db); //done
  let workingHoursOfMonth = await getWorkingHoursOfMonth(year, month, db); //done
  if (holidaysOfMonth.length > 0) {
    for (let [hm_key, hm] of Object.entries(holidaysOfMonth)) {
      daysOfMonth[hm_key]["day_type"] = "NON_WORKING_DAY";
      daysOfMonth[hm_key]["day_text"] = hm["name"];
    }
  }
  if (weekendsOfMonth.length > 0) {
    for (let [hm_key, hm] of Object.entries(weekendsOfMonth)) {
      daysOfMonth[hm_key]["day_type"] = "NON_WORKING_DAY";
      daysOfMonth[hm_key]["day_text"] = "Weekend Off";
    }
  }
  if (workingHoursOfMonth.length > 0) {
    for (let [hm_key, hm] of Object.entries(weekendsOfMonth)) {
      daysOfMonth[hm_key]["day_type"] = "WORKING_DAY";
      daysOfMonth[hm_key]["office_working_hours"] = hm["working_hours"];
    }
  }
  if (userid != false) {
    userWorkingHours = await getUserMangedHours(userid, db);
    if (userWorkingHours.length > 0) {
      for (let [key, dm] of Object.entries(daysOfMonth)) {
        for (let [hm_key, hm] of Object.entries(userWorkingHours)) {
          if (dm["full_date"] == hm["date"]) {
            daysOfMonth[key]["day_text"] = hm["reason"];
            daysOfMonth[key]["office_working_hours"] = hm["working_hours"];
            if (hm["working_hours"] == "00:00") {
              daysOfMonth[key]["day_type"] = "NON_WORKING_DAY";
            } else {
              daysOfMonth[key]["day_type"] = "WORKING_DAY";
            }
          }
        }
      }
    }
  }
  for (let [key, dom] of Object.entries(daysOfMonth)) {
    if (dom["office_working_hours"] != "") {
      explodeDayWorkingHours = dom["office_working_hours"].split(":");
      explodeDay_hour = explodeDayWorkingHours[0] * 60 * 60;
      explodeDay_minute = explodeDayWorkingHours[1] * 60;
      orignal_total_time = explodeDay_hour + explodeDay_minute;
      daysOfMonth[key]["orignal_total_time"] = orignal_total_time;
    }
  }
  return daysOfMonth;
};
let getNonworkingdayAsWorking = async (year, month, db) => {
  let list;
  list = await getWorkingHoursOfMonth(year, month, db);
  return list;
};

let getDaysOfMonth = async (year, month) => {
  let list = [];
  for (d = 1; d <= 31; d++) {
    let date = new Date();
    let newd = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    date.setHours(12);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMonth(month);
    date.setDate(d);
    date.setFullYear(year);
    if (date.getMonth() == month) {
      let c_full_date = newd;
      let c_date = date.getDate();
      let days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      let c_day = days[new Date(date).getDay()];
      let row = {};
      row.full_date = c_full_date;
      row.date = c_date;
      row.day = c_day;
      list[c_date] = row;
    }
  }
  return list;
};
let _addRequiredKeysForADay = async (days) => {
  let Return = [];
  for (let [k, day] of Object.entries(days)) {
    day["day_type"] = "WORKING_DAY";
    day["day_text"] = "";
    day["in_time"] = "";
    day["out_time"] = "";
    day["total_time"] = "";
    day["extra_time"] = "";
    day["text"] = "";
    day["admin_alert"] = "";
    day["admin_alert_message"] = "";
    Return.push(day);
  }
  return Return;
};
let getUserMangedHours = async (userid, db) => {
  let rows = await db.sequelize.query(
    `SELECT * FROM user_working_hours WHERE user_Id = ${userid} order by id DESC`,
    { type: QueryTypes.SELECT }
  );
  return rows;
};
let getHolidaysOfMonth = async (year, month, models) => {
  let q = await models.sequelize.query(`SELECT * FROM holidays`, {
    type: QueryTypes.SELECT,
  });
  let list = [];
  for (let pp of q) {
    let h_date = new Date(pp["date"]);
    let h_month = h_date.getMonth() + 1;
    let h_year = h_date.getFullYear();
    if (h_year == year && h_month == month) {
      let h_full_date = h_date;
      h_date = h_date.getDate();
      pp["date"] = h_date;
      pp["full_date"] = h_full_date; // added on 27 for days between leaves
      list[h_date] = pp;
    }
  }
  return list;
};
let getWeekendsOfMonth = async (year, month, db) => {
  let monthDays = await getDaysOfMonth(year, month, db);
  let list = [];
  for (let [k, v] of Object.entries(monthDays)) {
    if (v.day == "Sunday") {
      list[k] = v;
    }
  }
  let list2 = await getWorkingHoursOfMonth(year, month, db);
  let arr = [];
  for (key in list) {
    if (list2.includes(key)) {
      arr[key].push(list2[key]);
    }
  }
  return arr;
};
let getWorkingHoursOfMonth = async (year, month, db) => {
  let q = await db.sequelize.query("SELECT * FROM working_hours", {
    type: QueryTypes.SELECT,
  });
  let list = [];
  for (pp of q) {
    let h_date = new Date(pp["date"]);
    let h_month = h_date.getMonth() + 1;
    let h_year = h_date.getFullYear();
    if (h_year == year && h_month == month) {
      let h_full_date = h_date;
      h_date = h_date.getDate();
      pp["date"] = h_date;
      list[h_date] = pp;
    }
  }
  return list;
};
let getUserMonthPunching = async (userid, year, month, db) => {
  let list = [];
  let rows = await db.sequelize.query(
    `SELECT * FROM attendance Where user_id = ${userid}`,
    { type: QueryTypes.SELECT }
  );
  let allMonthAttendance = [];
  for (let [key, d] of Object.entries(rows)) {
    let d_timing = d["timing"];
    d_timing = d_timing.replace("-", "/");
    d_timing = new Date(d_timing);
    // check if date and time are not there in string
    if (d_timing.length < 10) {
    } else {
      let d_full_date = new Date(
        d_timing.getFullYear(),
        d_timing.getMonth(),
        d_timing.getDate()
      );
      let d_timestamp = d_timing.getTime();
      let d_month = d_timing.getMonth();
      let d_year = d_timing.getFullYear();
      let d_date = d_timing.getDate();

      if (d_year == year && d_month == month) {
        d["timestamp"] = d_timestamp;
        allMonthAttendance[d_date] = [];
        allMonthAttendance[d_date] = d;
      }
    }
  }
  // // added on 5jan2018----
  let genericMonthDays = await getGenericMonthSummary(year, month, userid, db); // $userid added on 5jan2018 by arun so as to use user working hours
  // // userMonthLeaves is added to get the working hours for halfday
  let userMonthLeaves = await getUserMonthLeaves(userid, year, month, db);
  for (let [pp_key, pp] of Object.entries(allMonthAttendance)) {
    let dayW_hours = false;
    if (
      genericMonthDays[pp_key] &&
      genericMonthDays[pp_key]["office_working_hours"]
    ) {
      dayW_hours = genericMonthDays[pp_key]["office_working_hours"];
    }
    // check if day is a leave and it is half day then daywhours will be 04:30 hours
    if (
      userMonthLeaves[pp_key] &&
      userMonthLeaves[pp_key]["no_of_days"] &&
      userMonthLeaves[pp_key]["no_of_days"] == "0.5"
    ) {
      dayW_hours = "04:30";
    }
    // console.log("_beautyDaySummary function is not complete yet to work on it ")
    let daySummary = await _beautyDaySummary(pp, (dayWorkingHours = false), db);
    list[pp_key] = daySummary;
  }
  return list;
};
let _beautyDaySummary = async (dayRaw, dayWorkingHours = false, db) => {
  let TIMESTAMP = "";
  let numberOfPunch = dayRaw.length;
  let timeStampWise = [];
  TIMESTAMP = dayRaw["timestamp"];
  timeStampWise[dayRaw["timestamp"]] = dayRaw;
  // sort on the basis of timestamp
  timeStampWise.sort();
  // inTimeKey = key(timeStampWise);
  // end(timeStampWise);
  // $outTimeKey = key($timeStampWise);
  // // employee in time
  // $inTime = date('h:i A', $inTimeKey);
  // // employee out time
  // $outTime = date('h:i A', $outTimeKey);
  // $r_date = (int) date('d', $TIMESTAMP);
  // $r_day = date('l', $TIMESTAMP);
  // $r_total_time = $r_extra_time_status = $r_extra_time = '';
  // // total no of hours present
  // $r_total_time = (int) $outTimeKey - (int) $inTimeKey;
  // // extra time
  // $r_extra_time = (int) $r_total_time - (int) ( 9 * 60 * 60 );
  // if ($r_extra_time < 0) { // not completed minimum hours
  //     $r_extra_time_status = "-";
  //     $r_extra_time = $r_extra_time * -1;
  // } else if ($r_extra_time > 0) {
  //     $r_extra_time_status = "+";
  // }
  // $return = array();
  // $return['in_time'] = $inTime;
  // $return['out_time'] = $outTime;
  // $return['total_time'] = $r_total_time;
  // $return['extra_time_status'] = $r_extra_time_status;
  // $return['extra_time'] = $r_extra_time;
  // return $return;
};

let getUserMonthLeaves = async (userid, year, month, db) => {
  let list = [];
  let rows = await db.sequelize.query(
    `SELECT * FROM leaves Where user_Id = ${userid}`,
    { type: QueryTypes.SELECT }
  );
  for (let pp of rows) {
    let pp_start = pp["from_date"];
    let pp_end = pp["to_date"];
    let datesBetween = await _getDatesBetweenTwoDates(pp_start, pp_end);
    for (d of datesBetween) {
      let h_month = new Date(d).getMonth();
      let h_year = new Date(d).getFullYear();

      if (h_year == year && h_month == month) {
        let h_full_date = new Date(d);
        let h_date = new Date(d).getDate();
        list[h_date] = pp;
      }
    }
  }

  // ksort($list); sorts associative array in assending order
  ///// remove non working days from leaves
  let monthHolidays = await getHolidaysOfMonth(year, month, db);
  let monthWeekends = await getWeekendsOfMonth(year, month, db);
  if (monthHolidays.length > 0) {
    for (let [d, v] of Object.entries(monthHolidays)) {
      if (d in list) {
        delete list[d];
      }
    }
  }
  if (monthWeekends.length > 0) {
    for (let [w, v2] of monthWeekends) {
      if (w in list) {
        delete list[w];
      }
    }
  }
  return list;
};
// var daylist = getDaysArray(new Date("2018-05-01"),new Date("2018-07-01"));
// daylist.map((v)=>v.toISOString().slice(0,10)).join("")
// console.log(daylist)

let _getDatesBetweenTwoDates = async (startDate, endDate) => {
  try {
    let currentDate = new Date(startDate).getDate() + 1;
    startDate = new Date(startDate).setDate(currentDate);
    let getDaysArray = function (startDate, endDate) {
      for (
        var arr = [], dt = new Date(startDate);
        dt <= endDate;
        dt.setDate(dt.getDate() + 1)
      ) {
        let d = new Date(dt);
        let date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        arr.push(date);
      }
      return arr;
    };
    let Return = getDaysArray(new Date(startDate), new Date(endDate));
    // Return.map((v) => v.toISOString().slice(0, 10)).join("");
    return Return;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};
let API_deleteHoliday = async (holiday_id, db) => {
  let r_error = 0;
  r_data = {};
  let Return = {};
  let holiday = await getHolidayDetails(holiday_id, db);
  if (holiday.length > 0) {
    let q = await db.sequelize.query(
      ` DELETE FROM holidays WHERE id = 'holiday_id'`,
      { type: QueryTypes.DELETE }
    );
    r_data.message = "Holiday Deleted Successfully.";
  } else {
    r_error = 1;
    r_data.message = "Holiday not Found.";
  }
  Return.error = r_error;
  Return.data = r_data;
  return Return;
};
let getHolidayDetails = async (holiday_id, db) => {
  let q = await db.sequelize.query(
    ` SELECT * from holidays WHERE id = '${holiday_id}' `,
    { type: QueryTypes.SELECT }
  );
  return q;
};
let addHoliday = async (name, date, type, db) => {
  try {
    let r_error = 0;
    let r_data = {};
    let Return = {};

    if (!name || name == "") {
      r_data.message = "Please provide holiday name.";
    } else if (!date || date == "") {
      r_data.message = "Please provide a holiday date.";
    } else if (!type || type == "") {
      r_data.message = "Please provide holiday type.";
    } else {
      date = date.split("T")[0];
      let rows = await db.sequelize.query(
        `SELECT * from holidays where date = '${date}'`,
        { type: QueryTypes.SELECT }
      );
      if (rows.length > 0) {
        r_error = 1;
        r_data.message = "Date Already Exists.";
      } else {
        let insert_holiday = await db.sequelize.query(
          `INSERT INTO holidays (name,date,type) VALUES ('${name}', '${date}', '${type}')`,
          { type: QueryTypes.INSERT }
        );
        r_data.message = "Holiday inserted successfully.";
      }
    }

    (Return.error = r_error), (Return.data = r_data);
    return Return;
  } catch (error) {
    console.log(error);
  }
};
let getHolidayTypesList = async (db) => {
  let list = [
    {
      type: 0,
      text: "Normal",
    },
    {
      type: 1,
      text: "Restricted",
    },
  ];
  return list;
};
let API_getHolidayTypesList = async (db) => {
  let r_error = 0;
  let r_data = {};
  r_data.holiday_type_list = await getHolidayTypesList(db);
  let Return = {};
  Return.error = r_error;
  Return.data = r_data;
  return Return;
};

let API_getYearHolidays = async (year, db) => {
  if (year == false) {
    year = new Date().getFullYear();
  }
  let rows = await db.sequelize.query(`SELECT * FROM holidays`, {
    type: QueryTypes.SELECT,
  });
  let list = [];

  let type_text = await getHolidayTypesList(db);

  if (year == false) {
    list = rows;
  } else {
    for (let pp of rows) {
      let h_date = pp["date"];
      h_date = new Date(h_date);
      h_year = h_date.getFullYear();
      for (let text of type_text) {
        if (pp["type"] == text["type"]) {
          pp["type_text"] = text["text"];
        }
      }
      if (h_year == year) {
        list.push(pp);
      }
    }
  }
  // if (list.length > 0) {
  for (let [key, v] of Object.entries(list)) {
    list[key]["month"] = new Date(v["date"]).toLocaleString("default", {
      month: "long",
    });
    list[key]["dayOfWeek"] = new Date(v["date"]).toLocaleString("default", {
      weekday: "long",
    });
  }
  // }

  let r_error = 0;
  let r_data = {};
  let Return = {};
  Return["error"] = r_error;
  r_data["message"] = "";
  r_data["holidays"] = list;
  Return["data"] = r_data;
  return Return;
};
let cancelAppliedLeave = async (req, db) => {
  try {
    let r_error = 1;
    let r_message = "";
    let r_data = {};
    let user_id = req.body["user_id"];
    let leave_start_date = new Date(req.body["date"]);
    let current_date = new Date();
    let time1 = current_date.getTime();
    let time2 = leave_start_date.getTime();
    if (time1 < time2) {
      leave_start_date = leave_start_date.toISOString().split("T")[0];
      let row2 = await db.sequelize.query(
        `SELECT * FROM leaves WHERE user_Id= ${user_id}  AND from_date= '${leave_start_date}' AND (status = 'Approved' OR status = 'Pending')`,
        { type: QueryTypes.SELECT }
      );
      if (row2.length > 0) {
        let q2 = await db.sequelize.query(
          `UPDATE leaves SET status = 'Cancelled Request' WHERE id=${row2[0]["id"]}`,
          { type: QueryTypes.UPDATE }
        );
        r_error = 0;
        r_message = `Your applied leave for ${req.body["date"]} has been cancelled`;
        r_data["message"] = r_message;
      } else {
        r_error = 1;
        r_message = `No Leave applied on ${req.body["date"]} or it has been cancelled already`;
        r_data["message"] = r_message;
      }
    } else {
      r_error = 1;
      r_message = `You cannot cancel leave of  ${req.body["date"]} .Contact HR for cancellation`;
      r_data["message"] = r_message;
    }
    let Return = {};
    Return["error"] = r_error;
    Return["data"] = r_data;
    return Return;
  } catch (error) {
    console.log(error);
  }
};
let API_getMyRHLeaves = async (userid, year, db) => {
  let r_error = 0;
  let r_data = {};
  if (!year || year == "") {
    year = new Date.getFullYear();
  }
  let rhList = await getMyRHLeaves(year, db);
  let rhLeaves = await getUserRHLeaves(userid, year, db);
  if (rhList.length > 0) {
    for (let [key, rh] of Object.entries(rhList)) {
      rhList[key]["status"] = "";
      for (let rhLeave of rhLeaves) {
        if (rhLeave["from_date"] == rh["raw_date"]) {
          rhList[key]["status"] = rhLeave["status"];
        }
      }
    }
    r_data["rh_list"] = rhList;
  } else {
    r_data["message"] = "Restricted holidays not found for ".year;
  }
  let Return = {};
  Return.error = r_error;
  Return.data = r_data;
  return Return;
};
let getUserRHLeaves = async (userid, year, db) => {
  let rows = await db.sequelize.query(
    `SELECT * FROM leaves WHERE leave_type = 'Restricted' AND user_Id = '${userid}' AND from_date LIKE '${year}%'`,
    { type: QueryTypes.SELECT }
  );
  return rows;
};
let getMyRHLeaves = async (year, db) => {
  let rows = await db.sequelize.query(
    `SELECT * FROM holidays WHERE type = 1 AND date LIKE '${year}%' ORDER BY date ASC `,
    { type: QueryTypes.SELECT }
  );
  if (rows.length > 0) {
    let rhType = await getHolidayTypesList();
    let i = 0;
    for (let [key, row] of Object.entries(rows)) {
      for (let type of rhType) {
        if (row["type"] == type["type"]) {
          rows[key]["type_text"] = type["text"];
        }
      }
      rows[key]["raw_date"] = row["date"];
      rows[key]["day"] = row["date"].toLocaleString("default", {
        weekday: "long",
      });
      rows[key]["month"] = row["date"].toLocaleString("default", {
        month: "long",
      });
      let explodeRawDate = row["date"].split("-");
      rows[key]["date"] =
        explodeRawDate[2] + -+`${rows[key]["month"]}` + -+explodeRawDate[0];
    }
  }
  return rows;
};

let getRHListForUserCompensation = async (userid, year, db) => {
  try {
    let d = new Date();
    year = year ? year : d.getFullYear();
    let final_rh_list = {};
    let rh_config = await getConfigByType("rh_config", db);
    let rh_rejection_setting = rh_config.rh_rejection_setting;
    let current_date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    let user = await getUserInfo(userid, db);
    let confirm_date = user.training_completion_date;
    if (confirm_date) {
      let rh_list = await getMyRHLeaves(year, db);
      let rh_approved = await getUserApprovedRHLeaves(userid, year, db);
      let rh_compensated = await getUserApprovedRHCompensationLeaves(
        userid,
        year,
        db
      );
      let maped = _.filter(
        _.map(rh_compensated, function (iter) {
          return iter.rh_dates ? JSON.parse(iter.rh_dates, true) : null;
        })
      );
      let uniqData = _.uniq(_.merge(maped, maped));
      let rh_compensated_dates = uniqData;
      let rh_list_dates = _.map(rh_list, function (iter) {
        return iter.raw_date;
      });
      let rh_approved_dates = _.map(rh_approved, function (iter) {
        return iter.from_date;
      });
      let final_dates = array_values(
        _.filter(
          _.difference(rh_list_dates, rh_approved_dates),
          function (iter) {
            return new Date(iter) < new Date(current_date);
          }
        )
      );
      final_dates = !_.isEmpty(rh_compensated_dates)
        ? array_values(_.difference(final_dates, rh_rh_compensated_dates))
        : final_dates;
      if (rh_rejection_setting) {
        let userLeaves = await getUserRHLeaves(userid, year, db);
        let rh_rejected_dates = _.filter(
          _.map(userLeaves, function (iter) {
            return iter.status == "Rejected" ? iter.from_date : false;
          })
        );
        final_dates = !_.isEmpty(rh_rejected_dates)
          ? array_values(_.intersection(final_dates, rh_rejected_dates))
          : rh_rejected_dates;
      }
      final_dates = array_values(
        _.map(final_dates, function (iter) {
          return new Date(iter) > new Date(confirm_date) ? iter : false;
        })
      );
      final_rh_list = array_values(
        _.filter(rh_list, function (iter) {
          return inArray(iter.raw_date, final_dates);
        })
      );
    }
    return final_rh_list;
  } catch (error) {
    throw new Error(error);
  }
};

let isEligibleForRHCompensation = async (
  userid,
  year,
  no_of_days,
  rh_dates,
  db
) => {
  try {
    let result;
    let check = false;
    let message = "";
    let rh_stats = await getEmployeeRHStats(userid, year, db);
    let total_rh_taken = rh_stats.rh_approved + rh_stats.rh_compensation_used;
    if (total_rh_taken >= rh_stats.rh_can_be_taken) {
      message = "You have reached the RH Quota this year.";
    } else {
      if (rh_stats.rh_can_be_taken_this_quarter > 0) {
        if (rh_stats.rh_can_be_taken_this_quarter < no_of_days) {
          message = `You can apply for only ${h_stats.rh_can_be_taken_this_quarter} days`;
        } else {
          if (_.isEmpty(rh_dates)) {
            message = "Please select RH for which you want to apply.";
          } else {
            if (no_of_days != rh_dates.length) {
              message = `Please select ${no_of_days} RH from the list`;
            } else {
              let rh_list = array_values(
                _.map(
                  await getRHListForUserCompensation(userid, year, db),
                  function (iter) {
                    return iter.raw_date;
                  }
                )
              );
              if (_.isEmpty(rh_list)) {
                message = "You don't have any RH to apply";
              } else {
                let find_dates = _.intersectionWith(
                  rh_dates,
                  rh_list,
                  _.isEqual
                );
                if (find_dates.length != no_of_days) {
                  message = "The RH must be selected from the RH list";
                } else {
                  let maped = _.filter(
                    _.map(
                      await getUserPendingLeaves(userid, year, db),
                      function (iter) {
                        return iter.leave_type == "RH Compensation"
                          ? JSON.parse(iter.rh_dates, true)
                          : false;
                      }
                    )
                  );
                  let uniqFiltered = _.uniq(_.merge(maped, maped));
                  let rh_comp_pending_dates = uniqFiltered;
                  let is_applied_rh_comp_exist = _.intersectionWith(
                    rh_comp_pending_dates,
                    rh_list,
                    _.isEqual
                  );
                  is_applied_rh_comp_exist = _.intersectionWith(
                    is_applied_rh_comp_exist,
                    rh_dates,
                    _.isEqual
                  );
                  if (!_.isEmpty(is_applied_rh_comp_exist)) {
                    let leaves = await getMyRHLeaves(year, db);
                    let maped = _.filter(
                      _.map(is_applied_rh_comp_exist, function (iter) {
                        return _.filter(
                          _.map(leaves, function (idx) {
                            return idx.raw_date == $iter ? idx.name : false;
                          })
                        );
                      })
                    );
                    let uniqFound = _.uniq(_.merge(maped, maped));
                    let rh_names = uniqFound;
                    message = `You have already applied compensation for ${_.join(
                      rh_names,
                      " ,"
                    )} Please contact admin to update status.`;
                  } else {
                    check = true;
                  }
                }
              }
            }
          }
        }
      } else {
        message = "You can't apply any RH in this quarter.";
      }
    }
    result = {
      check: check,
      message: message,
    };
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

let getLeavesForYearMonth = async (year, month, db) => {
  try {
    let year_month = year + "-" + month;
    let q = await db.sequelize.query(
      `SELECT * FROM leaves WHERE from_date LIKE '${year_month}%'`,
      { type: QueryTypes.SELECT }
    );
    return q;
  } catch (error) {
    throw new Error(error);
  }
};

let checkLeavesClashOfSameTeamMember = async (
  userid,
  from_date,
  to_date,
  db
) => {
  try {
    let check = false;
    let team = "";
    let d = new Date(from_date);
    let year = d.getFullYear();
    let month = d.getMonth() + 1;
    let applied_days = await getDaysBetweenLeaves(from_date, to_date, db);
    let applied_user_info = await getUserInfo(userid, db);
    team = applied_user_info.team;
    let leaves = await getLeavesForYearMonth(year, month, db);
    for await (let leave of leaves) {
      let userInfo = await getUserInfo(leave.user_Id, db);
      if (userInfo.team.toLowerCase() == team.toLowerCase()) {
        let check_days = await getDaysBetweenLeaves(
          leave.from_date,
          leave.to_date,
          db
        );
        for await (let applied_day of applied_days.data.days) {
          for await (let check_day of check_days.data.days) {
            if (applied_day.type == "working") {
              if (applied_day.full_date == check_day.full_date) {
                check = true;
              }
            }
          }
        }
      }
    }
    return check;
  } catch (error) {
    throw new Error(error);
  }
};

let applyLeave = async (
  userid,
  from_date,
  to_date,
  no_of_days,
  reason,
  day_status,
  leave_type,
  late_reason,
  pending_id = false,
  doc_link = false,
  rh_dates = false,
  db
) => {
  try {
    let Return = {};
    let r_message;
    let r_error=0;
    let success;
    from_date = new Date(from_date);
    let from_date_year = from_date.getFullYear();
    let leave_dates = await _getDatesBetweenTwoDates(from_date, to_date);
    // Check for RH Quarterwise
    if (leave_type.toLowerCase() == "restricted") {
      let rh_check = await checkRHQuarterWise(userid, from_date, db);
      if (!rh_check["check"]) {
        Return.error = 1;
        Return.data = {};
        Return.data.message = rh_check["message"];
        return Return;
      }
    }

    // Check for RH Compensation
    if (leave_type.toLowerCase() == "rh compensation") {
      let rh_compensation_check = await isEligibleForRHCompensation(
        userid,
        from_date_year,
        no_of_days,
        rh_dates,
        db
      );
      for (let ld of leave_dates) {
        for (let rh of rh_dates) {
          if (rh.getTime() > ld.getTime()) {
            Return.error = 1;
            Return.data = {};
            Return.data.message = `The RH selected on the RH Date: ${rh}  should be before the leave Date: ${ld} `;
            return Return;
          }
        }
      }
      rh_dates = JSON.parse(JSON.stringify(rh_dates));
      if (!rh_compensation_check["check"]) {
        Return.error = 1;
        Return.data = {};
        Return.data.message = rh_compensation_check["message"];
        return Return;
      }
    }
    let alert_message = "N/A";
    let check = await checkLeavesClashOfSameTeamMember(userid,from_date,to_date,db);
    if (check) {
      alert_message =
        "Another team member already has applied during this period so leave approve will depend on project.";
    }

    let applied_date = new Date();
    applied_date = JSON.stringify(applied_date).split("T")[0];
    applied_date = applied_date.substr(1, 11);
    let originalText_reason = reason;
    let originalText_late_reason = late_reason;
    from_date = JSON.stringify(from_date).split("T")[0];
    from_date = from_date.substr(1, 11);
    let q = await db.sequelize.query(
      `INSERT into leaves ( user_Id, from_date, to_date, no_of_days, reason, status, applied_on, day_status,leave_type,late_reason, doc_link, rh_dates ) VALUES ( ${userid}, '${from_date}', '${to_date}', ${no_of_days}, '${reason}', 'Pending', '${applied_date}', '${day_status}','${leave_type}','${late_reason}', '${doc_link}', '${rh_dates}' )`,
      { type: QueryTypes.INSERT }
    );
    if (q[0]) {
      leave_id = q[0];
      success = true;
      r_message = "Leave applied.";
    } else {
      r_error = 1;
      r_message = "Error in applying leave.";
    }
    if (r_error == 0) {
      if (pending_id != false) {
        if (
          await manipulatingPendingTimeWhenLeaveIsApplied(
            pending_id,
            no_of_days,db
          )
        ) {
          q = await db.sequelize.query(
            `Select * from users_previous_month_time where id = ${pending_id}`,
            { type: QueryTypes.SELECT }
          );
          oldStatus = row[0]["status"];
          q1 = await db.sequelize.query(
            `UPDATE users_previous_month_time SET status = '${oldStatus} - Leave applied for previous month pending time', status_merged = 1  Where id = ${pending_id}`,
            { type: QueryTypes.UPDATE }
          );
        }
      }
      let numberOfDays = "";
      if (day_status == "2") {
        numberOfDays = "second half day";
      } else if (day_status == "1") {
        numberOfDays = "first half day";
      } else {
        numberOfDays = "no_of_days days";
      }
      if (late_reason == "") {
        late_reason = "N/A";
      }
      // for slack implementation
      //     /* send message to employee and admin/hr*/
      //     messageBody = array(
      //         "numberOfDays" => numberOfDays,
      //         "fromDate" => from_date,
      //         "toDate" => to_date,
      //         "reason" => originalText_reason,
      //         "alertMessage" => alert_message,
      //         "lateReason" => originalText_late_reason,
      //         "docLink" => doc_link,
      //         "leave_type" => leave_type
      //     );
      //     slackMessageStatus = self::sendNotification( "apply_leave", userid, messageBody);

      //     /* send email */
      //     userInfo = self::getEmployeeCompleteInformation(userid);
      //     templateData = array_merge(messageBody, userInfo);
      //     emailData = array();
      //     $emailData['sendEmail'] = array(
      //         "to" => array($userInfo['work_email']),
      //         "cc" => self::getEmailCCList("Leave apply")
      //     );
      //     $emailData['templatekey'] = "Leave apply";
      //     $emailData['templateSubject'] = "";
      //     $emailData['templateData'] = $templateData;
      //     self::sendTemplateEmail($emailData);
      // }

      r_data = {};
      Return["error"] = r_error;
      r_data["message"] = r_message;
      r_data["leave_id"] = leave_id;
      Return["data"] = r_data;
      console.log(Return)
    }
    return Return;
  } catch (error) {
    console.log(error)
    throw new Error(error);
  }
};

let manipulatingPendingTimeWhenLeaveIsApplied=async(pending_id,leavesNumDays,db)=>{
  let row = await db.sequelize.query(`Select * from users_previous_month_time where id = '${pending_id}'`,{type:QueryTypes.SELECT});
  let newPendingHour = '00';
  let newPendingMinutes = '00';

  if( row.length != 0 ){
      let pendingTime = row['extra_time'];
      let pendingTimeExplode =pendingTime.split(":");
      let pending_hour = pendingTimeExplode[0];
      let pending_minute = pendingTimeExplode[1];

      if( leavesNumDays === '0.5' ){
          newPendingHour = (pending_hour * 1) - 4; // less 4 hrs as half day
      }else{
          newPendingHour = (pending_hour * 1) - ( leavesNumDays * 9 );
      }

      if( newPendingHour > 0 ){
          if( newPendingHour < 10 ){
              newPendingHour = '0'+newPendingHour;
          }
      }else {
          newPendingHour = '00';
      }
      if( pending_minute > 0 ){
          newPendingMinutes = pending_minute;
      }

      if( pending_hour == '00' ){
          newPendingMinutes = '00';
      }
  }

  let newPendingTime = newPendingHour+':'+newPendingMinutes;

  // update new time pending time to db
  if( newPendingTime != '00:00' ){
      q1 =await db.sequelize.query(`UPDATE users_previous_month_time SET extra_time = '${newPendingTime}'  Where id = '${pending_id}'`,{type:QueryTypes.UPDATE});
      return false; // means set status_merged will be 0
  }
  return true; // means set status_merged to 1
}
// let checkLeavesClashOfSameTeamMember=async()
let checkRHQuarterWise = async (userid, from_date, db) => {
  let check = false;
  let Return = {};
  let rh_config = await getConfigByType("rh_config", db);
  let no_of_quaters = Object.keys(await getAllQuarters());
  no_of_quaters = no_of_quaters.length;
  let rh_extra = rh_config["rh_extra"];
  let rh_can_be_taken_per_quarter = rh_config["rh_per_quater"];
  let rh_can_be_taken = no_of_quaters * rh_can_be_taken_per_quarter;
  let max_rh_can_be_taken_per_quarter = rh_can_be_taken_per_quarter;
  let user = await getUserInfo(userid, db);
  console.log("+++++++++++++++");
  console.log(user[0].id);
  user = user[0];
  if (
    user.training_completion_date != null &&
    user.training_completion_date != "0000-00-00" &&
    user.training_completion_date != "1970-01-01" &&
    new Date(user.training_completion_date) < new Date()
  ) {
    let from_date_year = new Date(from_date).getFullYear();
    let from_date_month = new Date(from_date).getMonth() + 1;
    let current_date = new Date();
    let current_year = new Date().getFullYear();
    let current_month = new Date().getMonth();
    let current_quarter = await getQuarterByMonth();
    let confirm_year = new Date(user["training_completion_date"]).getFullYear();
    let confirm_month = new Date(user["training_completion_date"]).getMonth();
    let confirm_quarter = await getQuarterByMonth(confirm_month, db);
    let from_date_quarter = await getQuarterByMonth(from_date_month, db);
    let rh_leaves_all = await getUserRHLeaves(userid, current_year, db);
    let rh_list = (await getMyRHLeaves(current_year, db)).map(function (iter) {
      return iter["raw_date"];
    });
    let rh_leaves = rh_leaves_all.map(function (iter) {
      return iter["from_date"];
    });
    let rh_approved = (
      await getUserApprovedRHLeaves(userid, current_year, db)
    ).map(function (iter) {
      return iter["from_date"];
    });
    let rh_approved_dates = (
      await getUserApprovedRHLeaves(userid, current_year, db)
    ).map(function (iter) {
      return iter["from_date"];
    });
    let rh_approved_count = (
      await getUserApprovedRHLeaves(userid, current_year, db)
    )
      .map(function (iter) {
        return iter["no_of_days"];
      })
      .reduce((a, b) => a + b, 0);
    let rh_compensated = (
      await getUserApprovedRHCompensationLeaves(userid, current_year, db)
    )
      .map(function (iter) {
        return iter["no_of_days"];
      })
      .reduce((a, b) => a + b, 0);
    let rh_stats = await getEmployeeRHStats(userid, current_year, db);
    max_rh_can_be_taken_per_quarter = rh_stats["rh_can_be_taken_this_quarter"];
    if (confirm_year == current_year) {
      remaining_quarters = no_of_quaters - confirm_quarter["quarter"];
      eligible_for_confirm_quarter_rh = false;
      if (confirm_quarter["months"][0] == confirm_month) {
        eligible_for_confirm_quarter_rh = true;
      }
      if (eligible_for_confirm_quarter_rh) {
        rh_can_be_taken =
          (remaining_quarters + 1) * rh_can_be_taken_per_quarter;
      } else {
        rh_can_be_taken = remaining_quarters * rh_can_be_taken_per_quarter;
      }
    } else if (confirm_year > current_year) {
      rh_can_be_taken = 0;
    }
    total_rh_taken = rh_approved_count + rh_compensated;
    apply_next_rh = true;
    // filter dates for calculating quarterly leave

    rh_taken_per_quarter = await getPreviousTakenRHQuaterly(
      userid,
      from_date_year,
      db
    );
    if ((rh_leaves_all).length > 0) {
      for await (let rh_leave of rh_leaves_all) {
        if (rh_leave["status"].toLowerCase() == "pending") {
          apply_next_rh = false;
          break;
        }
      }
    }
    let fromTime = new Date(from_date);
    let currentTime = new Date(current_date);
    if (fromTime < currentTime) {
      message = "You cannot apply previous RH.";
    } else {
      if (inArray(from_date, rh_list)) {
        if (apply_next_rh) {
          if (total_rh_taken >= rh_can_be_taken) {
            message =
              "You have reached the RH quota. You are not eligible for other RH this year.";
          } else {
            if (_.keysIn(from_date_quarter["quarter"], rh_taken_per_quarter)) {
              if (rh_taken_per_quarter[from_date_quarter["quarter"]] > 0) {
                if (max_rh_can_be_taken_per_quarter > 0) {
                  check = true;
                } else {
                  message = "You are not allowed take another RH this quarter.";
                }
              }
            } else {
              if (
                confirm_year == current_year &&
                from_date_quarter["quarter"] == confirm_quarter["quarter"]
              ) {
                if (eligible_for_confirm_quarter_rh) {
                  check = true;
                } else {
                  message = "You are not eligible for current quarter RH.";
                }
              } else {
                check = true;
              }
            }
          }
        } else {
          message = "Your previous RH status is pending. Contact admin.";
        }
      } else {
        message = "The date is not yet added in the RH list.";
      }
    }
  } else {
    message = "You are not a confirm employee so you are not eligible for RH";
  }

  Return["check"] = check;
  Return["message"] = message;

  return Return;
};
let getEmployeeRHStats = async (userid, year, db) => {
  console.log(userid,year)
  let Return = {};
  let rh_can_be_taken = 0;
  let rh_config_default = await getConfigByType("rh_config", db);
  let rh_per_quater = rh_config_default["rh_per_quater"];
  let rh_extra = rh_config_default["rh_extra"];
  let quarters = await getAllQuarters();
  let no_of_quaters = quarters.length;
  let rh_per_year = no_of_quaters * rh_per_quater + rh_extra;
  let max_rh_can_be_taken_per_quarter = rh_per_quater;
  let rh_approved,
    rh_rejected,
    rh_left,
    rh_compensation_used,
    rh_compensation_pending,
    rh_can_be_taken_this_quarter = 0;
  let rh_approved_names = {};
  let rh_rejected_names = [];
  let rh_compensation_used_names = {};
  let quarters_available = {};
  let user = await getUserInfo(userid, db);
  user = user[0];
  if (
    user["training_completion_date"] != null &&
    user["training_completion_date"] != "0000-00-00" &&
    user["training_completion_date"] != "1970-01-01" &&
    new Date(user["training_completion_date"]).getTime() < new Date().getTime()
  ) {
    let current_year = new Date().getFullYear();
    let confirm_date = user["training_completion_date"];
    let confirm_year = new Date(confirm_date).getFullYear();
    let confirm_month =
      new Date(user["training_completion_date"]).getMonth() + 1;
    let confirm_quarter = await getQuarterByMonth(confirm_month, db);
    let current_quarter = await getQuarterByMonth();
    let slice_quarter = 0;

    if (confirm_year == year) {
      let remaining_quarters = no_of_quaters - confirm_quarter["quarter"];
      let slice_quarter = confirm_quarter["quarter"];
      let eligible_for_confirm_quarter_rh = false;
      if (confirm_quarter["months"][0] == confirm_month) {
        eligible_for_confirm_quarter_rh = true;
      }
      if (eligible_for_confirm_quarter_rh) {
        rh_can_be_taken = (remaining_quarters + 1) * rh_per_quater;
        slice_quarter = slice_quarter - 1;
      } else {
        rh_can_be_taken = remaining_quarters * rh_per_quater;
      }
    } else if (confirm_year > year) {
      rh_can_be_taken = 0;
    } else {
      rh_can_be_taken = rh_per_year;
    }
    // console.log(quarters.slice(4),121212)
    // quarters_available = quarters.slice(slice_quarter);
    let rh_data_quaterly = await getPreviousTakenRHQuaterly(userid, year, db);
    let rh_leaves = await getUserRHLeaves(userid, year, db);
    let rh_compensation_leaves = await getUserApprovedRHCompensationLeaves(
      userid,
      year,
      db
    );
    let rh_approved_leaves = await getUserApprovedRHLeaves(userid, year, db);
    let rh_list = await getMyRHLeaves(year, db);
    // RH Approved Name
    rh_approved_dates = await array_values(
      rh_approved_leaves.map(function (iter) {
        return iter["from_date"];
      })
    );
    for (let date of rh_approved_dates) {
      names = array_values(
        rh_list
          .map(function (iter) {
            return date == iter["raw_date"] ? iter["name"] : false;
          })
          .filter(await aFilter())
      );

      rh_approved_names = rh_approved_names.concat(names);
    }
    rh_approved = rh_approved_names.length;
    // RH Rejected Leaves
    rh_rejected_leaves = await aFilter(rh_leaves, function (iter) {
      return iter["status"] == "Rejected";
    });
    console.log(rh_list);
    // RH Rejected Names
    rh_rejected_dates = await array_values(
      rh_rejected_leaves.map(function (iter) {
        return iter["from_date"];
      })
    );
    for (let date of rh_rejected_dates) {
      names = await array_values(
        aFilter(
          rh_list.map(function (iter) {
            return date == iter["raw_date"] ? iter["name"] : false;
          })
        )
      );
      rh_rejected_names = rh_rejected_names.concat(names);
    }
    rh_rejected = rh_rejected_names.length;
    // get all approved compensation dates
    let maped = _.filter(
      _.map(rh_compensation_leaves, function (iter) {
        return iter["rh_dates"] ? JSON.parse(iter["rh_dates"]) : null;
      })
    );
    let merged = _.merge(maped, maped);
    rh_compensation_used_dates = _.uniq(merged);
    console.log(rh_compensation_used_dates);
    for await (let date of rh_compensation_used_dates) {
      let name = array_values(
        _.filter(
          _.map(rh_list, function (iter) {
            return date == iter["raw_date"] ? iter["name"] : false;
          })
        )
      );
      rh_compensation_used_names = _.merge(rh_compensation_used_names, names);
    }
    rh_compensation_used = rh_compensation_used_names.length;
    total_rh_taken = rh_approved + rh_compensation_used;
    if (rh_can_be_taken >= total_rh_taken) {
      rh_left = rh_can_be_taken - total_rh_taken;
    }
    if (rh_rejected > rh_left) {
      rejected_rh_for_compensation = rh_left;
    } else {
      rejected_rh_for_compensation = rh_rejected;
    }
    rh_compensation_pending = await getRHListForUserCompensation(
      userid,
      year,
      db
    );
    rh_compensation_pending = rh_compensation_pending.length;
    if (rh_compensation_pending < 0) {
      rh_compensation_pending = 0;
    }
    if (year < current_year) {
      rh_compensation_pending = 0;
      rh_left = 0;
    }
    if (rh_compensation_pending > rh_left) {
      rh_compensation_pending = rh_left;
    }
    past_quarters = _.filter(quarters_available, function (iter) {
      return iter <= current_quarter["quarter"];
    });
    total_rh_taken_till_now = _.sum(rh_data_quaterly);
    if (total_rh_taken_till_now < past_quarters.length) {
      rh_can_be_taken_this_quarter =
        past_quarters.length - total_rh_taken_till_now;
    }
    if (_.sum(array_values(rh_data_quaterly)) >= rh_can_be_taken) {
      rh_can_be_taken_this_quarter = 0;
    }
    if (current_quarter.quarter == quarters_available.length - 1) {
      rh_can_be_taken_this_quarter += rh_extra;
    }
  }

  stats = {
    rh_can_be_taken: rh_can_be_taken,
    rh_can_be_taken_this_quarter: rh_can_be_taken_this_quarter,
    rh_approved: rh_approved,
    rh_approved_names: rh_approved_names,
    rh_rejected: rh_rejected,
    rh_rejected_names: rh_rejected_names,
    rh_left: rh_left,
    rh_compensation_used: rh_compensation_used,
    rh_compensation_used_names: rh_compensation_used_names,
    rh_compensation_pending: rh_compensation_pending,
  };
  return stats;
};
let aFilter = async (i) => {
  return i;
};
let array_values = async (input) => {
  const tmpArr = [];
  let key = "";
  for (key in input) {
    tmpArr[tmpArr.length] = input[key];
  }
  return tmpArr;
};
let getPreviousTakenRHQuaterly = async (userid, year, db) => {
  let rh_data_quaterly = (rh_dates = []);
  let rh_approved = await getUserApprovedRHLeaves(userid, year, db);
  let rh_compensation_approved = await getUserApprovedRHCompensationLeaves(
    userid,
    year,
    db
  );
  let total_rh = rh_approved.concat(rh_compensation_approved);
  for (let rh of total_rh) {
    let all_dates_btw_dates = await getDaysBetweenLeaves(
      rh["from_date"],
      $rh["to_date"]
    );
    for (let day of all_dates_btw_dates["data"]["days"]) {
      if (day["type"] == "working") {
        rh_dates = day["full_date"];
      }
    }
  }
  for (let date of rh_dates) {
    month = new Date(date);
    let quarter = await getQuarterByMonth(month, db);
    if (array_key_exists(quarter["quarter"], rh_data_quaterly)) {
      rh_data_quaterly[quarter["quarter"]] += 1;
    } else {
      rh_data_quaterly[quarter["quarter"]] = 1;
    }
  }

  return rh_data_quaterly;
};

let getUserApprovedRHLeaves = async (userid, year, db) => {
  let q = await db.sequelize.query(
    `SELECT * FROM leaves WHERE leave_type = 'Restricted' AND user_Id = '${userid}' AND status = 'Approved' AND from_date LIKE '${year}%'`,
    { type: QueryTypes.SELECT }
  );
  return q;
};
let getUserApprovedRHCompensationLeaves = async (userid, year, db) => {
  let q = await db.sequelize.query(
    `SELECT * FROM leaves WHERE leave_type = 'RH Compensation' AND user_Id = '${userid}' AND status = 'Approved' AND from_date LIKE '${year}%'`,
    { type: QueryTypes.SELECT }
  );
  return q;
};

let getQuarterByMonth = async (month = false, db) => {
  month = month ? month : new Date().getMonth();
  let current_quarter = false;
  let quarters = await getAllQuarters();
  for (let [key, quarter] of Object.entries(quarters)) {
    if (quarter.includes(month)) {
      current_quarter = {};
      current_quarter["quarter"] = key;
      current_quarter["months"] = quarter;
      break;
    }
  }
  return current_quarter;
};
let getAllQuarters = async () => {
  let quarters = [];

  quarters["1"] = [1, 2, 3];
  quarters["2"] = [4, 5, 6];
  quarters["3"] = [7, 8, 9];
  quarters["4"] = [10, 11, 12];
  return quarters;
};
let getConfigByType = async (type, db) => {
  let row = await db.sequelize.query(
    `select * from config where type='${type}' `,
    { type: QueryTypes.SELECT }
  );
  if (row.length == 0) {
    await insertDefaultConfigByType(type, db);
    return await getConfigByType(type, db);
  } else {
    return JSON.parse(row[0]["value"]);
  }
};

let insertDefaultConfigByType = async (type, db) => {
  let defaultConfigValue = "";
  switch (type) {
    case "attendance_csv":
      defaultConfigValue = JSON.stringify({
        user_id: {},
        time: {},
      });
      break;
    case "reset_password":
      defaultConfigValue = JSON.stringify({
        days: "",
        status: 0,
        last_updated: new Date(),
      });
      break;

    case "web_show_salary":
      defaultConfigValue = "0";
      break;

    case "login_types":
      defaultConfigValue = JSON.stringify({
        normal_login: true,
        google_login: false,
        google_auth_client_id: "",
      });
      break;

    case "alternate_saturday":
      arr = {};
      defaultConfigValue = JSON.stringify(arr);
      break;

    case "page_headings":
      arr = {};
      // // format
      // // $arr
      // //   arr .reference = "",
      // //    arr .value= ""
      //  // );
      defaultConfigValue = JSON.stringify(arr);
      break;

    case "inventory_audit_comments":
      defaultConfigValue = JSON.stringify({
        all_good: "Nothing To Report (all good)",
        issue: "Issue To Report",
        critical_issue: "Critical Issue To Report",
      });
      break;

    case "attendance_late_days":
      defaultConfigValue = "0";
      break;

    case "rh_config":
      defaultConfigValue = JSON.stringify({
        rh_per_quater: 1,
        rh_extra: 1,
        rh_rejection_setting: false,
      });
      break;

    default:
      break;
  }
  if (defaultConfigValue != "") {
    let q = await db.sequelize.query(
      ` INSERT INTO config( type, value ) VALUES( '${type}', '${defaultConfigValue}'`,
      { type: QueryTypes.INSERT }
    );
  }
};

let leaveDocRequest = async (leaveid, doc_request, comment, db) => {
  let leaveDetails = await getLeaveDetails(leaveid, db);
  let r_error = 0;
  let r_message = "";
  let message_to_user = "";
  let r_data = {};
  if (Array.isArray(leaveDetails)) {
    let old_status = leaveDetails["status"];
    let from_date = leaveDetails["from_date"];
    let to_date = leaveDetails["to_date"];
    let no_of_days = leaveDetails["no_of_days"];
    let applied_on = leaveDetails["applied_on"];
    let reason = leaveDetails["reason"];
    let q;
    if (doc_request) {
      q = await db.sequelize.query(
        `UPDATE leaves set doc_require= 1 WHERE id = '${leaveid}' `,
        { type: QueryTypes.UPDATE }
      );
      message_to_user = "You are requested to submit doc proof for this leave";
      r_message = "Admin request for leave doc send";
    }
    if (comment) {
      q = await db.sequelize.query(
        `UPDATE leaves set comment= '${comment}' WHERE id = '${leaveid}'`,
        { type: QueryTypes.UPDATE }
      );
      message_to_user = comment;
      r_message = "Admin commented on employee leave saved";
    }

    if (message_to_user != "") {
      let userid = leaveDetails["user_Id"];
      /* new notification system*/
      // $messageBody = array(
      //     "newStatus" => $old_status,
      //     "fromDate" => $from_date,
      //     "toDate" => $to_date,
      //     "noOfDays" => $no_of_days,
      //     "appliedOn" => $applied_on,
      //     "reason" => $reason,
      //     "messageFromAdmin" => $message_to_user,
      // );
      // $slackMessageStatus = self::sendNotification( "update_leave_status", $userid, $messageBody);

      /* send email */
      // $userInfo = self::getEmployeeCompleteInformation($userid);
      // $templateData = array_merge($messageBody, $userInfo);
      // $emailData = array();
      // $emailData['sendEmail'] = array(
      //     "to" => array($userInfo['work_email'])
      // );
      // $emailData['templatekey'] = "Leave status change";
      // $emailData['templateSubject'] = "";
      // $emailData['templateData'] = $templateData;
      // self::sendTemplateEmail($emailData);
    }
  } else {
    r_message = "No such leave found";
    r_error = 1;
  }

  Return = {};
  r_data = {};
  r_data.message = r_message;
  r_data.leaveid = leaveid;
  Return.error = r_error;
  Return.data = r_data;
  console.log(Return);
  return Return;
};
let getLeaveDetails = async (leaveid, db) => {
  let row = await db.sequelize.query(
    `SELECT users.*,leaves.* FROM leaves LEFT JOIN users ON users.id = leaves.user_Id where leaves.id = '${leaveid}'`,
    { type: QueryTypes.SELECT }
  );
  if (row["username"]) {
    delete row["username"];
  }
  if (row["password"]) {
    delete row["password"];
  }
  row["doc_link"] = await _getLeaveDocFullLink(row, db);
  return row;
};
let _getLeaveDocFullLink = async (leaveDetails, db) => {
  let leaveDoc = leaveDetails["doc_link"];
  if (leaveDoc != "" && leaveDoc != "N/A") {
    let uploadedImage = "";
    if (leaveDetails["doc_link"]) {
      uploadedImage = leaveDetails["doc_link"];
    }
    if (uploadedImage != "") {
      leaveDoc = `$_ENV['ENV_BASE_URL'].'attendance/uploads/leaveDocuments/'.${leaveDetails}['doc_link'];`;
    }
  }
  return leaveDoc;
};
let updateLeaveStatus = async (leaveid, newstatus, messagetouser, db, req) => {
  let leaveDetails = await getLeaveDetails(leaveid, db);
  let r_error = 0;
  let r_message = "";
  if (Array.isArray(leaveDetails)) {
    let old_status = leaveDetails[0]["status"];
    let from_date = leaveDetails[0]["from_date"];
    let to_date = leaveDetails[0]["to_date"];
    let no_of_days = leaveDetails[0]["no_of_days"];
    let applied_on = leaveDetails[0]["applied_on"];
    let reason = leaveDetails[0]["reason"];
    let rejectedReason = "";
    if (newstatus.toLowerCase() == "rejected") {
      rejectedReason = messagetouser;
    }
    let changeLeaveStatus1 = await changeLeaveStatus(
      leaveid,
      newstatus,
      rejectedReason,
      db
    );
    if (
      leaveDetails[0].leave_type.toLowerCase() == "restricted" ||
      leaveDetails[0].leave_type.toLowerCase() == "rh compensation"
    ) {
      if (changeLeaveStatus1 == true) {
        let updatedLeaveDetails = await getLeaveDetails(leaveid, db);
        let leave_dates = await getDaysBetweenLeaves(
          updatedLeaveDetails[0]["from_date"],
          updatedLeaveDetails[0]["to_date"],
          db
        );
        if (updatedLeaveDetails[0]["status"].toLowerCase() == "approved") {
          for (let date of leave_dates["data"]["days"]) {
            // entry_time =_ENV['DEFAULT_ENTRY_TIME'] ? _ENV['DEFAULT_ENTRY_TIME'] : "10:30 AM";
            // exit_time = _ENV['DEFAULT_EXIT_TIME'] ? _ENV['DEFAULT_EXIT_TIME'] : "07:30 PM";
            let entry_time = "10:30 AM";
            let exit_time = "07:30 PM";
            let newdate = JSON.stringify(date["full_date"]);
            newdate = newdate.split("T")[0];
            newdate = newdate.slice(1, 11);
            await insertUserInOutTimeOfDay(
              updatedLeaveDetails[0]["user_Id"],
              newdate,
              entry_time,
              exit_time,
              reason,
              db
            );
          }
        } else {
          for (date of leave_dates["data"]["days"]) {
            await deleteUserInOutTimeOfDay(
              updatedLeaveDetails[0]["user_Id"],
              date["full_date"]
            );
          }
        }
      }
    }
    if (messagetouser == "") {
      messagetouser = "N/A";
    }
    let userid = leaveDetails[0].user_Id;
    messageBody = [];
    (messageBody.newStatus = newstatus),
      (messageBody.fromDate = from_date),
      (messageBody.toDate = to_date),
      (messageBody.noOfDays = no_of_days),
      (messageBody.appliedOn = applied_on),
      (messageBody.reason = reason),
      (messageBody.messageFromAdmin = messagetouser);

    // $slackMessageStatus = self::sendNotification( "update_leave_status", $userid, $messageBody);
    let templatekey = false;
    if (newstatus.toLowerCase() == "rejected") {
      templatekey = "Leave rejected";
    } else if (newstatus.toLowerCase() == "approved") {
      $templatekey = "Leave approval";
    } else if (newstatus.toLowerCase() == "pending") {
      templatekey = "Leave pending";
    }
    let userInfo = await getEmployeeCompleteInformation(userid, req, db);
    let templateData = messageBody.concat(userInfo);
    let emailData = {};
    emailData.sendEmail = {};
    emailData.sendEmail.to = userInfo["work_email"];
    emailData.templatekey = templatekey;
    emailData.templateSubject = "";
    emailData.templateData = templateData;
    // self::sendTemplateEmail(emailData);

    r_message = `Leave status changes from ${old_status} to ${newstatus};`;
    console.log("end of function", 122332);
  } else {
    r_message = "No such leave found";
    r_error = 1;
  }
  let Return = {};
  let r_data = {};
  Return.error = 0;
  r_data.message = r_message;
  Return.data = r_data;
  console.log(Return);
  return Return;
};

let insertUserInOutTimeOfDay = async (
  userid,
  date,
  inTime,
  outTime,
  reason,
  db,
  isadmin = true
) => {
  let extra_time = 0;
  let newdate = date;
  //  if (isadmin == false) {
  let row = await db.sequelize.query(
    `select * from config where type='extra_time'`,
    { type: QueryTypes.SELECT }
  );
  let no_of_rows = row.length;
  if (no_of_rows > 0) {
    let extra_time = row[0]["value"];
  }
  let row2 = await db.sequelize.query(
    `select * from hr_data where user_id= ${userid} AND date = '${newdate}' `,
    { type: QueryTypes.SELECT }
  );
  // outTime=outTime.split(" ")[0]
  // outHours=outTime.split(":")[0]
  // outMins=outTime.split(":")[1]
  // console.log(outHours,outMins,12)
  // let exitTime=new Date().setHours(outHours)
  // exitTime=new Date().setMinutes(outMins)
  // console.log(exitTime,122112)
  // // exitTime.setHours()
  // console.log(new Date (exitTime),2322)
  // if (row2.length > 0) {
  // let entryTime=(inTime.split(" ")[0]);
  // let inHours=entryTime.split(":")[0]
  // let inMins=entryTime.split(":")[1]
  // console.log(mins,hours,122)
  if (!row2["entry_time"]) {
    inTime = inTime.split(" ")[0];
    let inHours = inTime.split(":")[0];
    let inMins = inTime.split(":")[1];
  }
  if (!row2["exit_time"]) {
    outTime = outTime.split(" ")[0];
    let outHours = outTime.split(":")[0];
    let outMins = outTime.split(":")[1];
  }

  // } else {
  //    outTime1=outTime.split(" ")[0]
  // let outHours=outTime1.split(":")[0]
  // let outMins =outTime1.split(":")[1]
  // //     let outTime = date("h:i A", strtotime($outTime) - ($extra_time * 60));
  // }
  // }
  let previous_entry_time = "";
  let previous_exit_time = "";
  let existingDetails = await getUserDaySummary(userid, date, db);
  if (existingDetails["data"]) {
    previous_entry_time = existingDetails["data"]["entry_time"];
    previous_exit_time = existingDetails["data"]["exit_time"];
  }
  let r_error = 1;
  let r_message = "";
  let r_data = {};
  if (inTime != "") {
    inTime1 = date + " " + inTime;
    insertInTime = new Date(inTime1);
    await insertUserPunchTime(userid, insertInTime, db);
  }
  if (outTime != "") {
    outTime1 = date + " " + outTime;
    insertOutTime = new Date(inTime1);
    // $insertOutTime = date('m-d-Y h:i:sA', strtotime($outTime1));
    await insertUserPunchTime(userid, insertOutTime, db);
  }
  let h = inTime.split(":")[0];
  let m = inTime.split(":")[1];
  inTime = new Date().setHours(h);
  inTime = new Date().setMinutes(m);
  if (inTime != "" && outTime != "") {
    let h_date = new Date(date);
    await insertUpdateHr_data(userid, h_date, inTime, outTime, db);
    let punchInTimeMessage = "";
    let punchOutTimeMessage = "";
    if (previous_entry_time != "" && previous_entry_time != inTime) {
      punchInTimeMessage =
        "Entry Time - From $previous_entry_time to ${inTime} \n ";
    } else {
      punchInTimeMessage = "Entry Time - ${inTime} \n ";
    }
    if (previous_exit_time != "" && previous_exit_time != outTime) {
      punchOutTimeMessage =
        "Exit Time - From $previous_exit_time to ${outTime} \n ";
    } else {
      punchOutTimeMessage = "Exit Time - ${outTime} \n";
    }
    // $messageBody = array(
    //     "date" => $h_date,
    //     "punchInTime" => $punchInTimeMessage,
    //     "punchOutTime" => $punchOutTimeMessage,
    //     "reason" => $reason
    // );
    // $slackMessageStatus = self::sendNotification( "update_employee_punch_timings", $userid, $messageBody);
  }
  r_error = 0;
  let Return = {};
  Return.error = r_error;
  r_data["message"] = r_message;
  Return.data = r_data;

  return Return;
};
let insertUpdateHr_data = async (userid, date, entry_time, exit_time, db) => {
  //d-m-Y
  let rows = await db.sequelize.query(
    `SELECT * FROM hr_data WHERE user_id = '${userid}' AND date= '${date}'`,
    { type: QueryTypes.SELECT }
  );

  if (rows.length > 0) {
    //update
    let q = await db.sequelize.query(
      `UPDATE hr_data set entry_time='${entry_time}', exit_time='${exit_time}' WHERE user_id = '${userid}' AND date = '${date}' `,
      { type: QueryTypes.UPDATE }
    );
  } else {
    //insert
    userInfo = await getUserInfo(userid, db);
    emailid = userInfo["work_email"];
    q = await db.sequelize.query(
      `INSERT into hr_data ( user_id, email, entry_time, exit_time, date  ) VALUES ( '${userid}', '${emailid}', '${entry_time}', '${exit_time}', '${date}' )`,
      { type: QueryTypes.INSERT }
    );
  }
  return true;
};
let insertUserPunchTime = async (user_id, timing) => {
  // $q = "INSERT into attendance ( user_id, timing ) VALUES ( $user_id, '$timing')";
  // self::DBrunQuery($q);
  // return true;
  let q = await db.sequelize.query(
    `SELECT * FROM attendance WHERE user_id = '${user_id}' AND timing = '${timing}' `,
    { type: QueryTypes.SELECT }
  );
  if (q.length < 1) {
    q = await db.sequelize.query(
      `INSERT into attendance ( user_id, timing ) VALUES ( '${user_id}', '${timing}') `,
      { type: QueryTypes.INSERT }
    );
  }
  return true;
};

let getUserDaySummary = async (userid, date, db) => {
  let userInfo = await getUserInfo(userid, db);
  let r_error = 1;
  let r_message = "";
  let r_data = {};

  let userDayPunchingDetails = await getUserDayPunchingDetails(
    userid,
    date,
    db
  );
  r_data.name = userInfo.name;
  // $r_data.profileImage =await _getEmployeeProfilePhoto(userInfo);
  r_data.userid = userid;
  r_data.year = userDayPunchingDetails.year;
  r_data.month = userDayPunchingDetails.month;
  r_data.monthName = userDayPunchingDetails.monthName;
  r_data.day = userDayPunchingDetails.day;
  r_data.entry_time = userDayPunchingDetails.in_time;
  r_data.exit_time = userDayPunchingDetails.out_time;

  r_data.total_working = "";

  if (userDayPunchingDetails["total_time"]) {
    let aa = await _secondsToTime(userDayPunchingDetails["total_time"], db);
    r_data["total_working"] =
      aa["h"] + "h : " + aa["m"] + "m :" + aa["s"] + "s";
  }

  r_error = 0;
  Return = {};
  Return.error = r_error;
  r_data["message"] = r_message;
  Return.data = r_data;
  return Return;
};

let _secondsToTime = async (seconds, db) => {
  // $padHours == true will return with 0 , ie, if less then 10 then 0 will be attached
  let status = "+";

  if (seconds * 1 < 0) {
    seconds = seconds * -1;
    status = "-";
  }

  // extract hours
  let hours = Math.trunc(seconds / (60 * 60));

  // extract minutes
  let divisor_for_minutes = seconds % (60 * 60);
  let minutes = Math.trunc(divisor_for_minutes / 60);

  // extract the remaining seconds
  let divisor_for_seconds = divisor_for_minutes % 60;
  seconds = Math.ceil(divisor_for_seconds);

  // return the final array
  let obj = {};
  obj.h = hours;
  obj.m = minutes;
  obj.s = seconds;
  obj.status = status;

  let padData = {};
  padData.h = hours;
  padData.m = minutes;
  padData.s = seconds;
  if (hours < 10) {
    padData["h"] = "0" + hours;
  }
  if (minutes < 10) {
    padData["m"] = "0" + minutes;
  }
  if (seconds < 10) {
    padData["s"] = "0" + seconds;
  }

  obj["pad_hms"] = padData;
  return obj;
};

let getUserDayPunchingDetails = async (userid, date, db) => {
  let requested_date = new Date(date).getDate();
  let requested_month = new Date(date).getMonth();
  let requested_year = new Date(date).getFullYear();
  let requested_month_name = new Date(date).toLocaleString("default", {
    month: "long",
  });
  let requested_day = new Date(date).toLocaleString("default", {
    weekday: "long",
  });
  let userMonthPunching = await getUserMonthPunching(
    userid,
    requested_year,
    requested_month,
    db
  );
  let r_in_time = (r_out_time = r_total_time = "");
  let r_extra_time_status = (r_extra_time = "");

  // if (requested_date in userMonthPunching) {
  //     let dayPunchFound = userMonthPunching[requested_date];
  //     r_in_time = dayPunchFound['in_time'];
  //     r_out_time = dayPunchFound['out_time'];
  //     r_total_time = dayPunchFound['total_time'];
  //     r_extra_time_status = dayPunchFound['extra_time_status'];
  //     r_extra_time = dayPunchFound['extra_time'];
  // }

  Return = {};
  Return.year = requested_year;
  Return.month = requested_month;
  Return.monthName = requested_month_name;
  Return.date = requested_date;
  Return.day = requested_day;
  Return.in_time = r_in_time;
  Return.out_time = r_out_time;
  Return.total_time = r_total_time;
  Return.extra_time_status = r_extra_time_status;
  Return.extra_time = r_extra_time;
  return Return;
};

let deleteUserInOutTimeOfDay = async (userid, date, isadmin = true, db) => {
  let newdate = JSON.stringify(date["full_date"]);
  newdate = newdate.split("T")[0];
  newdate = newdate.slice(1, 11);
  let q = await db.sequelize.query(
    `SELECT * FROM attendance WHERE user_id = '${userid}' AND timing LIKE '%${newdate}%'`,
    { type: QueryTypes.SELECT }
  );
  if (sizeof($rows) > 0) {
    let q = await db.sequelize.query(
      `DELETE FROM attendance WHERE user_id = '${userid}' AND timing LIKE '%${newdate}%'`,
      { type: QueryTypes.DELETE }
    );
  }
  return true;
};

let getDaysBetweenLeaves = async (startDate, endDate, db) => {
  // api calls
  let allDates = await _getDatesBetweenTwoDates(startDate, endDate, db);
  //extract year and month of b/w dates
  let yearMonth = [];

  for (let d of allDates) {
    let m = d.getMonth() + 1;
    let y = d.getFullYear();
    let check_key = `${y}_${m}`;
    if (!yearMonth.includes(check_key)) {
      let row = {};
      row.year = y;
      row.month = m;
      yearMonth[check_key] = row;
    }
  }
  // //--all holidays between dates
  let ALL_HOLIDAYS = [];
  let ALL_WEEKENDS = [];

  for (let [k, v] of Object.entries(yearMonth)) {
    let my_holidays = await getHolidaysOfMonth(v["year"], v["month"], db);
    let my_weekends = await getWeekendsOfMonth(v["year"], v["month"], db);

    ALL_HOLIDAYS = ALL_HOLIDAYS.concat(my_holidays);
    ALL_WEEKENDS = ALL_WEEKENDS.concat(my_weekends);
  }
  let finalDates = [];
  for (ad of allDates) {
    let row = {
      type: "working",
      sub_type: "",
      sub_sub_type: "",
      full_date: ad,
    };
    finalDates.push(row);
  }

  if (finalDates.length > 0 && ALL_WEEKENDS.length > 0) {
    for (let [key, ad] of finalDates) {
      for (let [k, aw] of Object.entries(ALL_WEEKENDS)) {
        if (ad["full_date"] == aw["full_date"]) {
          let row = {
            type: "non_working",
            sub_type: "weekend",
            sub_sub_type: "",
            date: ad["full_date"],
          };
          finalDates[key] = row;
          break;
        }
      }
    }
  }
  if (finalDates.length > 0 && ALL_HOLIDAYS.length > 0) {
    for (let [key, ad] of Object.entries(finalDates)) {
      for (let [k, aw] of Object.entries(ALL_HOLIDAYS)) {
        if (ad["full_date"] == aw["full_date"]) {
          let row = {
            type: "non_working",
            sub_type: "holiday",
            sub_sub_type: aw["name"],
            date: ad["full_date"],
          };
          finalDates[key] = row;
          break;
        }
      }
    }
  }

  //-----------------
  let res_working_days = 0;
  let res_holidays = 0;
  let res_weekends = 0;
  for (let f of finalDates) {
    if (f["type"] == "working") {
      res_working_days++;
    } else if (f["type"] == "non_working") {
      if (f["sub_type"] == "holiday") {
        res_holidays++;
      } else if (f["sub_type"] == "weekend") {
        res_weekends++;
      }
    }
  }

  let r_data = {};
  r_data["start_date"] = startDate;
  r_data["end_date"] = endDate;
  r_data["working_days"] = res_working_days;
  r_data["holidays"] = res_holidays;
  r_data["weekends"] = res_weekends;
  r_data["days"] = finalDates;

  Return = {};
  Return["error"] = 0;
  r_data["message"] = "";
  Return["data"] = r_data;

  return Return;
};

let changeLeaveStatus = async (leaveid, newstatus, rejectedReason, db) => {
  let q;
  if (rejectedReason != false) {
    q = await db.sequelize.query(
      `UPDATE leaves set status='${newstatus}', rejected_reason='${rejectedReason}' WHERE id = ${leaveid}`,
      { type: QueryTypes.UPDATE }
    );
  } else {
    q = await db.sequelize.query(
      `UPDATE leaves set status='${newstatus}' WHERE id = ${leaveid}`,
      { type: QueryTypes.UPDATE }
    );
  }
  return true;
};
let getAllUsersPendingLeavesSummary = async (year, month, db, req) => {
  let r_error = 1;
  let r_message = "";
  let r_data = {};
  let usersAttendance = [];
  let enabledUsersList = await getEnabledUsersList(req, db);
  for (let u of enabledUsersList) {
    let userid = u["user_Id"];
    let username = u["username"];
    if (username == "admin" || userid == "" || username == "") {
      continue;
    }
    let user_month_attendance = await getUserMonthAttendaceComplete(
      userid,
      year,
      month,
      db
    );
    user_month_attendance = user_month_attendance["data"];

    let raw = user_month_attendance["attendance"];
    let finalAttendance = {};

    for (let pp of raw) {
      pp["display_date"] = pp["full_date"];
      if (pp["day_type"] == "WORKING_DAY") {
        if (pp["in_time"] == "" || pp["out_time"] == "") {
          finalAttendance.push(pp);
        }
      } else if (
        pp["day_type"] == "LEAVE_DAY" ||
        pp["day_type"] == "HALF_DAY"
      ) {
        finalAttendance.push(pp);
      }
    }
    if (finalAttendance.length > 0) {
      let u_data = {};
      u_data["name"] = u["name"];
      // u_data['profileImage'] =await _getEmployeeProfilePhoto(u);
      u_data["jobtitle"] = u["jobtitle"];
      u_data["userid"] = userid;
      u_data["year"] = user_month_attendance["year"];
      u_data["month"] = user_month_attendance["month"];
      u_data["monthName"] = user_month_attendance["monthName"];
      u_data["monthSummary"] = user_month_attendance["monthSummary"];
      u_data["nextMonth"] = user_month_attendance["nextMonth"];
      u_data["previousMonth"] = user_month_attendance["previousMonth"];
      u_data["attendance"] = finalAttendance;
      usersAttendance = u_data;
    }
  }
  let nextMonth = await _getNextMonth(year, month);
  let previousMonth = await _getPreviousMonth(year, month);
  let currentMonth = await _getCurrentMonth(year, month);
  //----------

  r_data["year"] = year;
  r_data["month"] = month;
  r_data["monthName"] = currentMonth["monthName"];
  r_data["nextMonth"] = nextMonth;
  r_data["previousMonth"] = previousMonth;
  r_data["leavesSummary"] = usersAttendance;

  r_error = 0;
  Return = {};
  Return.error = r_error;
  r_data.message = r_message;
  Return.data = r_data;

  return Return;
};

let getUserMonthAttendaceComplete = async (userid, year, month, db) => {
  let r_error = 1;
  let r_message = "";
  let r_data = {};
  let userMonthAttendance = await getUserMonthAttendace(
    userid,
    year,
    month,
    db
  );
  let monthSummary = await _beautyMonthSummary(userMonthAttendance, db);
  let beautyMonthAttendance = await _beautyMonthAttendance(
    userMonthAttendance,
    db
  );

  let nextMonth = await _getNextMonth(year, month);
  let previousMonth = await _getPreviousMonth(year, month);
  let currentMonth = await _getCurrentMonth(year, month);
  //----user details -----
  let userDetails = await getUserInfo(770, db);
  dateofjoining = userDetails[0]["dateofjoining"];
  delete userDetails["password"];

  ///////////
  // r_data['userProfileImage'] = await _getEmployeeProfilePhoto(userDetails);
  r_data["userName"] = userDetails["name"];
  r_data["userjobtitle"] = userDetails["jobtitle"];
  r_data["userid"] = userid;
  r_data["year"] = year;
  r_data["month"] = month;
  r_data["monthName"] = currentMonth["monthName"];
  r_data["monthSummary"] = monthSummary;
  r_data["nextMonth"] = nextMonth;
  r_data["previousMonth"] = previousMonth;
  /* add check if date is before joining date */
  if (dateofjoining && beautyMonthAttendance.length > 0) {
    for (let [key, value] of Object.entries(beautyMonthAttendance)) {
      beautyMonthAttendance[key]["isDayBeforeJoining"] = false;
      if (
        new Date(dateofjoining).getTime() >
        new Date(value["full_date"]).getTime()
      ) {
        beautyMonthAttendance[key]["isDayBeforeJoining"] = true;
      }
    }
  }
  /* add check if date is before joining date */

  r_data["attendance"] = beautyMonthAttendance;
  // added to calculate compensation times added by arun on 29th jan 2018
  let analyseCompensationTime = await _analyseCompensationTime(
    beautyMonthAttendance
  );
  r_data["compensationSummary"] = analyseCompensationTime;

  r_error = 0;
  let Return = {};
  Return.error = r_error;
  Return.r_data = {};
  Return.r_data.message = r_message;
  Return["data"] = r_data;
  return Return;
};

let _getCurrentMonth = async (year, month) => {
  month = month + 1;
  let currentMonthDate = new Date(year + "-" + month + "-" + 01);
  currentMonth = {};
  currentMonth["year"] = currentMonthDate.getFullYear();
  currentMonth["month"] = currentMonthDate.getMonth();
  currentMonth["monthName"] = currentMonthDate.toLocaleString("default", {
    month: "long",
  });
  return currentMonth;
};

let _getNextMonth = async (year, month) => {
  month = month + 2;
  let nextMonthDate = new Date(year + "-" + month + "-" + 01);
  let nextMonth = {};
  nextMonth["year"] = nextMonthDate.getFullYear();
  nextMonth["month"] = nextMonthDate.getMonth();
  nextMonth["monthName"] = nextMonthDate.toLocaleString("default", {
    month: "long",
  });
  return nextMonth;
};
let _beautyMonthSummary = async (monthAttendace, db) => {
  let r_actual_working_hours =
    (r_completed_working_hours =
    r_pending_working_hours =
      0);

  let WORKING_DAYS = (NON_WORKING_DAYS = LEAVE_DAYS = HALF_DAYS = 0);

  let r_actual_working_seconds =
    (r_completed_working_seconds =
    r_pending_working_seconds =
      0);

  for (let [k, pp] of Object.entries(monthAttendace)) {
    let day_type = pp["day_type"];

    if (day_type == "WORKING_DAY" || day_type == "HALF_DAY") {
      r_actual_working_seconds += pp["orignal_total_time"];
    }

    if (day_type == "WORKING_DAY") {
      WORKING_DAYS++;
      r_completed_working_seconds += pp["total_time"];
    } else if (day_type == "NON_WORKING_DAY") {
      NON_WORKING_DAYS++;
    } else if (day_type == "LEAVE_DAY") {
      LEAVE_DAYS++;
    } else if (day_type == "HALF_DAY") {
      HALF_DAYS++;
      r_completed_working_seconds += pp["total_time"];
    }
  }
  // //-----------------------------
  // //r_actual_working_seconds = $WORKING_DAYS * 9 * 60 * 60;
  r_pending_working_seconds =
    r_actual_working_seconds - r_completed_working_seconds;
  // //-----------------------------
  let a = await _secondsToTime(r_actual_working_seconds, db);
  r_actual_working_hours = a.h + " Hrs " + a["m"] + " Mins";

  let b = await _secondsToTime(r_completed_working_seconds, db);
  r_completed_working_hours = b["h"] + " Hrs " + b["m"] + " Mins";

  let c = await _secondsToTime(r_pending_working_seconds);
  r_pending_working_hours =
    c["status"] + " " + c["h"] + " Hrs " + c["m"] + " Mins";

  let monthSummary = {};
  monthSummary.actual_working_hours = r_actual_working_hours;
  monthSummary.completed_working_hours = r_completed_working_hours;
  monthSummary.pending_working_hours = r_pending_working_hours;
  monthSummary.WORKING_DAY = WORKING_DAYS;
  monthSummary.NON_WORKING_DAY = NON_WORKING_DAYS;
  monthSummary.LEAVE_DAY = LEAVE_DAYS;
  monthSummary.HALF_DAY = HALF_DAYS;
  monthSummary.admin_alert = "";
  monthSummary.admin_alert_message = "";

  monthSummary.seconds_actual_working_hours = r_actual_working_seconds;
  monthSummary.seconds_completed_working_hours = r_completed_working_seconds;
  monthSummary.seconds_pending_working_hours = r_pending_working_seconds;
  return monthSummary;
};

let _analyseCompensationTime = async (beautyAttendance) => {
  let seconds_to_be_compensate = 0;
  let seconds_for_compensation = 0;
  let compensation_break_up = [];
  let currentDate = new Date();

  for (let [k, day] of Object.entries(beautyAttendance)) {
    // don't include todays date
    if (currentDate == day["full_date"]) {
      continue;
    }
    let breakUpText = "";
    //       // print_r($day);
    if (day["day_type"] === "WORKING_DAY" || day["day_type"] === "HALF_DAY") {
      //           /* added on 7th oct 2019 by arun -  if in/out time is missing don't consider it as compensation time*/
      if (!day["in_time"] && !day["out_time"]) {
        continue;
      }
      //           /* added on 7th oct 2019 by arun -  if in/out time is missing don't consider it as compensation time*/
      let day_full_date = day["full_date"];
      let day_orignal_total_time = day["orignal_total_time"];
      let date_for_break_up = day["full_date"].getDate();

      //           // if in out time is missing
      if (day["total_time"].trim() == "" || day["total_time"].trim() == 0) {
        seconds_to_be_compensate += day_orignal_total_time;
        // storing per day working hours if in out time is missing ( 9 hrs )
        seconds_for_compensation += day_orignal_total_time;
        let hms = await _secondsToTime(day_orignal_total_time);
        let hms_show =
          hms["pad_hms"]["h"] +
          "h:" +
          hms["pad_hms"]["m"] +
          "m:" +
          hms["pad_hms"]["s"] +
          "s";

        breakUpText = `${date_for_break_up} Addition ${hms_show}`;
      } else {
        day_extra_time_status = day["extra_time_status"];
        day_seconds_extra_time = day["seconds_extra_time"];
        if (day_extra_time_status === "-") {
          // echo "PLUS <br>";
          seconds_to_be_compensate += day_seconds_extra_time;
          // $breakUpText = "$date_for_break_up # Addition in compensation Time : $day_full_date : $day_seconds_extra_time";

          let hms = await _secondsToTime(day_seconds_extra_time);
          let hms_show =
            hms["pad_hms"]["h"] +
            "h:" +
            hms["pad_hms"]["m"] +
            "m:" +
            hms["pad_hms"]["s"] +
            "s";
          // calculate per day compensaton time if less than 4hrs and add it to previous compensation time
          if (day_seconds_extra_time < 14400) {
            seconds_for_compensation += day_seconds_extra_time;
            breakUpText = `${date_for_break_up} # Addition # ${hms_show}`;
          }
        }
        if (day_extra_time_status === "+" && seconds_to_be_compensate > 0) {
          // echo "MINUS <br>";
          seconds_to_be_compensate -= day_seconds_extra_time;
          let hms = await _secondsToTime(day_seconds_extra_time);
          let hms_show =
            hms["pad_hms"]["h"] +
            "h:" +
            hms["pad_hms"]["m"] +
            "m:" +
            hms["pad_hms"]["s"] +
            "s";
          // calculate per day compensaton time if less than 4hrs and subtract it from previous compensation time
          if (day_seconds_extra_time < 14400) {
            seconds_for_compensation -= $day_seconds_extra_time;
            breakUpText = `${date_for_break_up} # Deduction # ${hms_show}`;
          }
        }
      }
    }

    if (seconds_to_be_compensate < 0) {
      seconds_to_be_compensate = 0;
    }
    if (seconds_for_compensation < 0) {
      seconds_for_compensation = 0;
    }

    if (breakUpText != "") {
      // hms = self::_secondsToTime(seconds_to_be_compensate);
      // calculate pending compensation time and skipping 4hr or more compensation time
      hms = await _secondsToTime(seconds_for_compensation);
      hms_show =
        hms["pad_hms"]["h"] +
        "h:" +
        hms["pad_hms"]["m"] +
        "m:" +
        hms["pad_hms"]["s"] +
        "s";
      breakUpText = breakUpText + `## Pending = ${hms_show}`;
    }

    // echo "----------------- :: $seconds_to_be_compensate<br><br>";

    if (breakUpText != "") {
      row = {};
      row.text = breakUpText;
      compensation_break_up = row;
    }
  }

  Return = {};
  Return["seconds_to_be_compensate"] = seconds_to_be_compensate;
  Return["time_to_be_compensate"] = "";
  if (seconds_to_be_compensate > 0) {
    bb = await _secondsToTime(seconds_to_be_compensate);
    Return["time_to_be_compensate"] =
      bb["h"] + "h : " + bb["m"] + "m :" + bb["s"] + "s";
  }
  Return["compensation_break_up"] = compensation_break_up;
  return Return;
};

let _beautyMonthAttendance = async (monthAttendance) => {
  for (let [key, mp] of Object.entries(monthAttendance)) {
    //check for future working day
    if (mp["day_type"] && mp["day_type"] == "WORKING_DAY") {
      let currentTimeStamp = new Date().getTime();
      mp_timeStamp = mp["full_date"].getTime();
      if (mp_timeStamp > currentTimeStamp) {
        monthAttendance[key]["day_type"] = "FUTURE_WORKING_DAY";
      }
    }
    // // convert total working time to readable format
    if (mp["total_time"] && mp["total_time"]) {
      let aa = await _secondsToTime(mp["total_time"]);
      monthAttendance[key]["total_time"] =
        aa["h"] + "h : " + aa["m"] + "m :" + aa["s"] + "s";
    }
    // //convert extra time to readable format
    if (mp["extra_time"] && mp["extra_time"]) {
      let bb = await _secondsToTime(mp["extra_time"]);
      monthAttendance[key]["extra_time"] =
        bb["h"] + "h : " + bb["m"] + "m :" + bb["s"] + "s";
    }
  }
  return monthAttendance;
};
let getAllLeaves = async (req, db) => {
  let currentDate = new Date();
  let month = currentDate.getMonth();
  month = month + 1 - 6;
  // console.log(month,223223)
  let pastDate = new Date().setMonth(month);
  pastDate = new Date(pastDate);
  let currentYear = new Date().getFullYear();
  let rh_list = await getMyRHLeaves(currentYear, db);
  pastDate = JSON.stringify(pastDate).split("T")[0];
  pastDate = pastDate.slice(1, 11);
  currentDate = JSON.stringify(currentDate).split("T")[0];
  currentDate = currentDate.slice(1, 11);
  //   //$q = "SELECT users.*,user_profile.* FROM users LEFT JOIN user_profile ON users.id = user_profile.user_Id where users.status = 'Enabled' ";
  let rows = await db.sequelize.query(
    `SELECT users.*,leaves.* 
        FROM leaves 
        LEFT JOIN users ON users.id = leaves.user_Id 
        where users.status = 'Enabled' 
        AND applied_on BETWEEN '${pastDate}' AND '${currentDate}'
        order by leaves.id DESC `,
    { type: QueryTypes.SELECT }
  );
  let pendingLeaves = [];
  if (rows.length > 0) {
    for (let [k, p] of Object.entries(rows)) {
      p_id = p["id"];
      // let userInfo = await getUserInfo( p['user_Id'],db);
      // rows[k]['user_complete_info'];
      delete rows[k]["password"];

      //           ///
      if (p["status"].toLowerCase().trim() == "pending") {
        let lastLeaves = await getUsersLeaves(p["user_Id"], db);
        if (lastLeaves.length > 0) {
          for (let [lk, lp] of Object.entries(lastLeaves)) {
            if (lp["id"] == p_id) {
              delete lastLeaves[lk];
            }
          }
          if (lastLeaves.length > 0) {
            for (let [kl, ll] of Object.entries(lastLeaves)) {
              lastLeaves[kl]["from_date"] = ll["from_date"];
              lastLeaves[kl]["to_date"] = ll["to_date"];
              lastLeaves[kl]["applied_on"] = ll["applied_on"];
            }
          }
          lastLeaves = lastLeaves.slice(0, 5);
          p["last_applied_leaves"] = lastLeaves;
        }

        pendingLeaves.push(p);
        delete rows[k];
      } else {
        rows[k]["last_applied_leaves"] = {};
      }
    }
  }

  let newRows = rows;
  if (pendingLeaves.length > 0) {
    newRows = pendingLeaves.concat(rows);
  }
  //   // date view change
  if (newRows.length > 0) {
    for (let [k, v] of Object.entries(newRows)) {
      newRows[k]["from_date"] = v["from_date"];
      newRows[k]["to_date"] = v["to_date"];
      newRows[k]["applied_on"] = v["applied_on"];
      /* get doc link */
      newRows[k]["doc_link"] = await _getLeaveDocFullLink(v, db);
    }
  }

  //   //----
  if (newRows.length > 0) {
    enabledUsersList = await getEnabledUsersList(req, db);
    for (let [k, p] of Object.entries(newRows)) {
      let p_userid = p["user_Id"];
      for (let [kkk, ev] of Object.entries(enabledUsersList)) {
        if (p_userid == ev["user_Id"]) {
          newRows[k]["user_profile_name"] = ev["name"];
          newRows[k]["user_profile_jobtitle"] = ev["jobtitle"];
          // newRows[k]['user_profile_image'] = await _getEmployeeProfilePhoto(ev);
          break;
        }
      }

      if (!p["rh_names"]) {
        let names = [];
        if (p["leave_type"] == "RH Compensation") {
          if (p["rh_dates"]) {
            dates = JSON.parse(p["rh_dates"]);
            for (let date of dates) {
              for (let rh of rh_list) {
                if (rh["raw_date"] == date) {
                  names = rh["name"].trim();
                }
              }
            }
          }
        }
        if (p["leave_type"] == "Restricted") {
          for (let rh of rh_list) {
            if (rh["raw_date"] == p["from_date"]) {
              names = rh["name"].trim();
            }
          }
        }
        newRows[k]["rh_names"] = JSON.stringify(names);
      }
    }
  }
  newRows = newRows.filter((item) => item);

  let Return = {};
  let r_data = {};
  Return["error"] = 0;
  r_data["message"] = "";
  r_data["leaves"] = newRows;
  Return["data"] = r_data;

  return Return;
};

let getUsersLeaves = async (userid, db) => {
  let list = [];
  let year = new Date().getFullYear();
  let rows = await db.sequelize.query(
    `SELECT * FROM leaves Where user_Id = ${userid} order by id DESC`,
    { type: QueryTypes.SELECT }
  );
  let rh_list = await getMyRHLeaves(year, db);
  for (let [key, row] of Object.entries(rows)) {
    let names = [];
    if (row["leave_type"] == "RH Compensation") {
      if (row["rh_dates"]) {
        let dates = JSON.parse(row["rh_dates"]);
        for (let date of dates) {
          for (let rh of rh_list) {
            if (rh["raw_date"] == date) {
              names = rh["name"].trim();
            }
          }
        }
      }
    }
    if (row["leave_type"] == "Restricted") {
      for (let rh of rh_list) {
        if (rh["raw_date"] == row["from_date"]) {
          names = rh["name"].trim();
        }
      }
    }
    rows[key]["rh_names"] = JSON.stringify(names);
  }

  return rows;
};
let API_getEmployeeRHStats = async (userid, year, db) => {
  let Return = {};
  year = year ? year : new Date().getFullYear();
  let error = 0;
  let stats = await getEmployeeRHStats(userid, year, db);
  Return["error"] = error;
  Return["data"] = stats;
  return Return;
};
let getMyLeaves = async (userid, db) => {
  let msg;
  let userLeaves = await getUsersLeaves(userid, db);
  if (userLeaves.length > 0) {
    for (let [k, v] of Object.entries(userLeaves)) {
      userLeaves[k]["from_date"] = new Date(v["from_date"]);
      userLeaves[k]["to_date"] = new Date(v["to_date"]);
      userLeaves[k]["applied_on"] = new Date(v["applied_on"]);
      userLeaves[k]["doc_link"] = await _getLeaveDocFullLink(v, db);
    }
    msg = "";
  } else {
    msg = "no leave found";
  }

  let Return = {};
  let r_data = {};
  Return.error = 0;
  r_data.message = msg;
  r_data.leaves = userLeaves;
  Return.data = r_data;

  return Return;
}
let API_getAllEmployeesRHStats=async(year,db)=>{
  let Return = {};
  let stats = [];
  year = year ? year : new Date().getFullYear();
  let employees = await getEnabledUsersList('dateofjoining',db);
  for( let employee of employees ){
      let userid = employee['user_Id'];
      let rh_stats =await getEmployeeRHStats(userid,year,db);
      stats1= {
          'user_id': userid,
          'name': employee['name'],
          'designation': employee['jobtitle'],
          'stats': rh_stats
      };
      stats.push(stats1)
  }
  Return['error'] = 0;
  Return['data'] = stats;

  return Return;
}

module.exports = {
  _getNextMonth,
  _secondsToTime,
  getGenericMonthSummary,
  getDaysOfMonth,
  _getPreviousMonth,
  leaveDocRequest,
  getEmployeeLastPresentDay,
  API_deleteHoliday,
  addHoliday,
  getHolidayTypesList,
  API_getHolidayTypesList,
  API_getYearHolidays,
  cancelAppliedLeave,
  API_getMyRHLeaves,
  applyLeave,
  updateLeaveStatus,
  getDaysBetweenLeaves,
  getAllUsersPendingLeavesSummary,
  getUserMonthAttendace,
  getAllLeaves,API_getEmployeeRHStats,
  getMyLeaves,_getDatesBetweenTwoDates,
  API_getAllEmployeesRHStats,
  _getCurrentMonth,
  getUserMonthAttendaceComplete,getUserDaySummary,
  getUserMonthLeaves,getUserMonthPunching
};
