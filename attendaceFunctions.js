const { QueryTypes } = require("sequelize");
const _ = require("lodash");
const moment = require("moment");
const { getUserInfo } = require("./allFunctions");
const { inArray, empty } = require("./settingsFunction");
const { getEnabledUsersList } = require("./employeeFunction");
const db = require("./db");
const {
  _getDatesBetweenTwoDates,
  _getNextMonth,
  _getPreviousMonth,
  _getCurrentMonth,
  getGenericMonthSummary,
  getUserMonthAttendace,
  getUserDaySummary,
} = require("./leavesFunctions");

const getAllUserPrevMonthTime = async (year, month, db) => {
  let r_error = 1;
  let r_message = "";
  let r_data = {};
  let format_array = [];
  let yearMonthForQuery = year + "-" + month;
  let rows = await db.sequelize.query(
    `Select users.status,user_profile.name,users_previous_month_time.* from users Inner Join user_profile on users.id = user_profile.user_Id Inner Join users_previous_month_time on users.id = users_previous_month_time.user_Id where users_previous_month_time.year_and_month ='${yearMonthForQuery}' AND users.status='Enabled'`,
    { type: QueryTypes.SELECT }
  );
  if (rows.length > 0) {
    for (let val of rows) {
      let hr_min = "";
      hr_min = val["extra_time"].split(":");
      val["pending_hour"] = hr_min[0];
      val["pending_minute"] = hr_min[1];
      date = year + "-" + month + "-01";
      time_detail = await userCompensateTimedetail(val["user_Id"], date);
      val["time_detail"] = time_detail;
      format_array.push(val);
    }
  }
  let nextMonth = await _getNextMonth(year, month, db);
  let previousMonth = await _getPreviousMonth(year, month, db);
  let currentMonth = await _getCurrentMonth(year, month, db);

  r_data["nextMonth"] = nextMonth;
  r_data["previousMonth"] = previousMonth;
  r_data["month"] = month;
  r_data["monthName"] = currentMonth["monthName"];
  r_data["year"] = year;
  r_data["user_list"] = format_array;

  if (rows.length > 0) {
    r_error = 0;
    r_message = "Data found";
  } else {
    r_error = 1;
    r_message = "No Data found";
  }
  let Return = {};
  Return["error"] = r_error;
  Return["data"] = r_data;
  Return["message"] = r_message;
  return Return;
};

let updateDayWorkingHours = async (date, time, db) => {
  // let r_error=1;
  let q = await db.sequelize.query(
    `SELECT * FROM working_hours WHERE date='${date}'`,
    { type: QueryTypes.SELECT }
  );
  let message = "";
  console.log(q.length);
  if (Array.isArray(q) && q.length > 0) {
    console.log(11111);
    q = await db.sequelize.query(
      `UPDATE working_hours set working_hours='${time}' WHERE date = '${date}'`,
      { type: QueryTypes.UPDATE }
    );
    console.log(1);
    message = "Success Update";
    console.log(12112);
  } else {
    q = await db.sequelize.query(
      `INSERT into working_hours ( working_hours, date  ) VALUES ( '${time}', '${date}' )`,
      { type: QueryTypes.INSERT }
    );
    console.log(q, 1212);
    message = "Success Insert";
  }
  let monthYear = {
    month: new Date(date).getMonth() + 1,
    year: new Date(date).getFullYear(),
  };
  r_error = 0;
  Return = {};
  let r_data = {};
  Return["error"] = r_error;
  r_data["message"] = message;
  r_data["monthYear"] = monthYear;
  Return["data"] = r_data;
  return Return;
};
let multipleAddUserWorkingHours = async (req, db) => {
  let r_error = 0;
  let r_message = "";
  let r_data = {};
  let logged_user_id = req.userData.id;
  let date_start = "";
  let date_end = "";
  let week_day = "";
  let week_of_month = "";
  let userid = "";
  let day_type = ""; // working OR non-working
  let working_hours = "";
  let reason = "";
  if (req.body.day_type != "working") {
    working_hours = "00:00";
  }
  if (req.body.date_start == "" || req.body.date_end == "") {
    r_error = 1;
    r_message = "Start or end date is missing";
  } else if (req.body.week_day == "" || req.body.week_of_month == "") {
    r_error = 1;
    r_message = "Week day or week of month is missing";
  } else if (req.body.day_type == "") {
    r_error = 1;
    r_message = "Day type is missing";
  } else {
    let dates = await _getDatesBetweenTwoDates(date_start, date_end);
    let monthsYear = [];
    for (let [key, value] of dates) {
      let p_year = new Date(value).getFullYear();
      let p_month = new Date(value).getMonth() + 1;
      let p_year_month = p_year + "-" + p_month;
      if (!(monthsYear[p_year_month] != "undefined")) {
        monthsYear[p_year_month] = {
          year: p_year,
          month: p_month,
        };
      }
    }
    let daysToConsiderFinalArray = [];

    let logsText = "";
    if (monthsYear.length > 0) {
      for (let [key, ym] of monthsYear) {
        let monthDays = await getGenericMonthSummary(ym["year"], ym["month"]);
        let check_week_of_month = 0;
        for (let [key, md] of monthDays) {
          if (md["day"].toLowerCase() == req.body.week_day.toLowerCase()) {
            check_week_of_month++;
            if (
              new Date(md["full_date"]).getTime() >=
                new Date(date_start).getTime() &&
              new Date(md["full_date"]).getTime() <=
                new Date(date_end).getTime()
            ) {
              if (check_week_of_month == week_of_month) {
                daysToConsiderFinalArray.push(md);
              }
            }
          }
        }
      }
    }
    if (daysToConsiderFinalArray.length > 0) {
      for (let [key, d] of Object.entries(daysToConsiderFinalArray)) {
        let date = d["full_date"];
        await addUserWorkingHours(
          req.body.userid,
          date,
          req.body.working_hours,
          req.body.reason,
          db
        );
        if (logsText == "") {
          logsText += date;
        } else {
          logsText += ", " + date;
        }
      }
      r_message = "Working hours added";
    } else {
      r_message = "No matching dates found for opted criteria";
      logsText = r_message;
    }
    let q = await db.sequelize.query(
      `INSERT INTO user_working_hours_multiadd_logs
        (userid, week_day, week_of_month, day_type, working_hours, date_start, date_end, reason, updated_by, logs)
        VALUES
        ('${req.body.userid}', '${req.body.week_day}', '${req.body.week_of_month}', '${req.body.day_type}', '${req.body.working_hours}', '${req.body.date_start}', '${req.body.date_end}', '${req.body.reason}', ${logged_user_id} , '${logsText}' )`,
      { type: QueryTypes.INSERT }
    );
  }
  r_error = 0;
  let Return = {};
  Return["error"] = r_error;
  Return["message"] = r_message;
  Return["data"] = r_data;
  return Return;
};
let addUserWorkingHours = async (
  userid,
  date,
  working_hours,
  reason,
  db,
  pending_id = false
) => {
  let insert = await insertUserWorkingHours(
    userid,
    date,
    working_hours,
    reason,
    db
  );
  console.log(8888888);
  // let beautyDate = date('d-M-Y', strtotime($date));
  // /* send notification to user and hr*/
  // let messageBody = {
  //     "date": beautyDate,
  //     "time": working_hours,
  //     "reason": reason
  // }
  // $slackMessageStatus = self::sendNotification( "update_employee_working_hours", $userid, $messageBody);

  if (pending_id != false) {
    let row = await db.sequelize.query(
      `Select * from users_previous_month_time where id = '${pending_id}'`,
      { type: QueryTypes.SELECT }
    );
    let oldStatus = row["status"];
    let q = await db.sequelize.query(
      `UPDATE users_previous_month_time SET status = '${oldStatus} - Time added to user working hours', status_merged = 1  Where id = '${pending_id}'`,
      { type: QueryTypes.UPDATE }
    );
  }
  let r_data = {};
  let Return = {};
  Return["error"] = 0;
  r_data["message"] = "Successfully added";
  Return["data"] = r_data;

  return Return;
};
let insertUserWorkingHours = async (
  userid,
  date,
  working_hours,
  reason,
  db
) => {
  let q = await db.sequelize.query(
    `INSERT INTO user_working_hours ( user_Id, date, working_hours, reason ) VALUES ( '${userid}', '${date}', '${working_hours}', '${reason}')`,
    { type: QueryTypes.INSERT }
  );
  return true;
};
let getWorkingHoursSummary = async (year, month, db) => {
  let r_data = {};
  let workingHoursSummary = await getGenericMonthSummary(
    year,
    month,
    (userid = false),
    db
  );
  let aa = [];
  for (let p of workingHoursSummary) {
    aa.push(p);
  }

  let nextMonth = await _getNextMonth(year, month);
  let previousMonth = await _getPreviousMonth(year, month);
  let currentMonth = await _getCurrentMonth(year, month);
  r_data["year"] = year;
  r_data["month"] = month;
  r_data["monthName"] = currentMonth["monthName"];
  // r_data['monthSummary'] = monthSummary;
  r_data["nextMonth"] = nextMonth;
  r_data["previousMonth"] = previousMonth;
  r_data["monthSummary"] = aa;

  r_error = 0;
  let Return = {};
  Return["error"] = r_error;
  r_data["message"] = "";
  Return["data"] = r_data;

  return Return;
};
let getEmployeeCurrentMonthFirstWorkingDate = async (userid, db) => {
  let Return = false;
  let currentDate = new Date();
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth() + 1;
  let currentDateDate = new Date().getDate();

  let monthDetails = await getUserMonthAttendace(
    userid,
    currentYear,
    currentMonth,
    db
  );

  let tempArray = [];
  for (let md of monthDetails) {
    md_date = md["date"];
    if (md["day_type"] == "WORKING_DAY") {
      tempArray.push(md);
    }
  }
  Return = tempArray[0];
  return Return;
};

let geManagedUserWorkingHours = async (userid, db) => {
  // api call
  let allWorkingHours = await getUserMangedHours1(userid, db);

  let finalData = {};
  if (Array.isArray(allWorkingHours) && allWorkingHours.length > 0) {
    finalData = allWorkingHours;
  }

  let Return = {};
  Return["error"] = 0;
  r_data = {};
  r_data["message"] = "";
  r_data["list"] = finalData;
  userInfo = await getUserInfo1(userid, db);
  delete userInfo["password"];
  r_data["userInfo"] = userInfo;
  Return["data"] = r_data;

  return Return;
};
let getUserMangedHours1 = async (userid, db) => {
  let rows =
    (`SELECT * FROM user_working_hours WHERE user_Id = userid order by id DESC`,
    { type: QueryTypes.SELECT });
  return rows;
};
let getUserInfo1 = async (userid, models) => {
  try {
    let isAdmin;
    let q = await models.sequelize.query(
      `SELECT users.*, user_profile.*, 
      roles.id as role_id, 
      roles.name as role_name FROM users 
      LEFT JOIN user_profile ON users.id = user_profile.user_Id 
      LEFT JOIN user_roles ON users.id = user_roles.user_id 
      LEFT JOIN roles ON user_roles.role_id = roles.id where users.id = ${userid} `,
      { type: QueryTypes.SELECT }
    );
    if (isAdmin == null) {
      delete q.holding_comments;
    }
    // let userSlackInfo = await getSlackUserInfo(q.work_email);
    // q.slack_profile = userSlackInfo;
    return q;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};
let insertUserInOutTimeOfDay = async (
  userid,
  date,
  inTime,
  outTime,
  reason,
  db,
  req
) => {
  let extra_time = 0;
  let newdate = new Date(date);
  let isadmin;
  if (req.userData.role.toLowerCase() == "admin") {
    isadmin = true;
  } else {
    isadmin = false;
  }
  if (isadmin == false) {
    let q = await db.sequelize.query(
      `select * from config where type='extra_time'`,
      { type: QueryTypes.SELECT }
    );
    if (q.length > 0) {
      extra_time = row["value"];
    }
    let row2 = await db.sequelize.query(
      `select * from hr_data where user_id= '${userid}' AND date = '${newdate}'`,
      { type: QueryTypes.SELECT }
    );
    if (row2.length > 0) {
      if (_.isEmpty(row2["entry_time"])) {
        let timeStamp = await timetostamp(inTime, date);
        timestamp = timestamp + extra_time * 60;
        let inTimeDate = new Date(timeStamp);
        inTime = await getCurrentTime(inTimeDate);
      }
      if (_.Empty(row2["exit_time"])) {
        let timeStamp = await timetostamp(outTime, date);
        timeStamp = timeStamp - extra_time * 60;
        let outTimeDate = new Date(timeStamp);
        outTime = await getCurrentTime(outTimeDate);
      }
    } else {
      let timeStamp = await timetostamp(outTime, date);
      timeStamp = timeStamp - extra_time * 60;
      let outTimeDate = new Date(timeStamp);
      outTime = await getCurrentTime(outTimeDate);
    }
  }
  //start -- first get existing time details
  let previous_entry_time = "";
  let previous_exit_time = "";
  let existingDetails = await getUserDaySummary(userid, date, db);
  if ((existingDetails["data"]) != "undefined") {
    previous_entry_time = existingDetails["data"]["entry_time"];
    previous_exit_time = existingDetails["data"]["exit_time"];
  }
  let r_error = 1;
  let r_message = "";
  let r_data = {};
  if (inTime != "") {
    let inTime1 = date + " " + inTime;
    let insertInTime = inTime1;
    await insertUserPunchTime(userid, insertInTime, db);
  }
  if (outTime != "") {
    let outTime1 = date + " " + outTime;
    let insertOutTime = outTime1;
    await insertUserPunchTime(userid, insertOutTime);
  }
  if (inTime != "" && outTime != "") {
    let h_date = new Date(date);
    await insertUpdateHr_data(userid, h_date, inTime, outTime, db);
    let punchInTimeMessage = "";
    let punchOutTimeMessage = "";
    if (previous_entry_time != "" && previous_entry_time != inTime) {
      punchInTimeMessage = `Entry Time - From ${previous_entry_time} to ${inTime}`;
    } else {
      punchInTimeMessage = `Entry Time - ${inTime}`;
    }
    if (previous_exit_time != "" && previous_exit_time != outTime) {
      punchOutTimeMessage = `Exit Time - From ${previous_exit_time} to ${outTime}`;
    } else {
      punchOutTimeMessage = `Exit Time - ${outTime} `;
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
  Return["error"] = r_error;
  r_data["message"] = r_message;
  Return["data"] = r_data;
  console.log(Return);
  return Return;
};

let insertUpdateHr_data = async (userid, date, entry_time, exit_time, db) => {
  date = JSON.parse(JSON.stringify(date));
  date = date.slice(0, 10);
  //d-m-Y
  let q = await db.sequelize.query(
    `SELECT * FROM hr_data WHERE user_id = '${userid}' AND date= '${date}'`,
    { type: QueryTypes.SELECT }
  );

  if (q.length > 0) {
    //update
    q = await db.sequelize.query(
      `UPDATE hr_data set entry_time='${entry_time}', exit_time='${exit_time}' WHERE user_id = '${userid}' AND date = '${date}'`,
      { type: QueryTypes.UPDATE }
    );
  } else {
    //insert
    let userInfo = await getUserInfo1(userid, db);
    let emailid = userInfo[0]["work_email"];
    q = await db.sequelize.query(
      `INSERT into hr_data ( user_id, email, entry_time, exit_time, date  ) VALUES ( '${userid}', '${emailid}', '${entry_time}', '${exit_time}', '${date}' )`,
      { type: QueryTypes.INSERT }
    );
  }
  return true;
};

let insertUserPunchTime = async (user_id, timing) => {
  //   console.log(timing.sp)
  // $q = "INSERT into attendance ( user_id, timing ) VALUES ( $user_id, '$timing')";
  // self::DBrunQuery($q);
  // return true;
  let q = await db.sequelize.query(
    `SELECT * FROM attendance WHERE user_id = '${user_id}' AND timing = '${timing}'`,
    { type: QueryTypes.SELECT }
  );
  if (q.length < 1) {
    q = await db.sequelize.query(
      `INSERT into attendance ( user_id, timing ) VALUES ('${user_id}', '${timing}')`,
      { type: QueryTypes.INSERT }
    );
  }
  return true;
};

let getCurrentTime = async (date) => {
  var currentTime;
  // here we can give our date
  var currentDate = new Date(date);
  // OR we can define like that also for current date
  // var currentDate = new Date();
  var hour = currentDate.getHours();
  var meridiem = hour >= 12 ? "PM" : "AM";
  currentTime =
    ((hour + 11) % 12) + 1 + ":" + currentDate.getMinutes() + meridiem;
  return currentTime;
};
let timetostamp = async (time, date = false) => {
  let hr = time.split(":")[0];
  let min = time.split(":")[1];
  min = min.split("A")[0];
  let meridean = time.split(":")[1];
  meridean = meridean.slice(2, 4);
  if (date == false) {
    date = new Date();
    date = JSON.parse(JSON.stringify(date)).slice(0, 10);
  }
  if (meridean.toLowerCase() == "am") {
  } else {
    hr = hr + 12;
  }
  let dateToParse = date + " " + hr + ":" + min + ":" + 00;
  dateToParse = dateToParse.toString();
  let timestamp = Date.parse(dateToParse);
  return timestamp;
};
let addManualAttendance = async (
  user_id,
  time_type,
  date,
  manual_time,
  reason,
  db
) => {
  let last_inserted_ids = {};
  let dateTime = [];
  let Return = {};
  Return_msg = [];
  let bodyActionButtons = {};
  let exist = 0;
  let hours = "";
  entry_time = new Date(date + " " + manual_time["entry_time"]);
  exit_time = new Date(date + " " + manual_time["exit_time"]);
  let timediff = {};
  timediff.h = moment(exit_time).hours() - moment(entry_time).hours();
  timediff.i = moment(exit_time).minutes() - moment(entry_time).minutes();
  timediff.h > 0 ? (hours = timediff.h) : (hours = false);
  timediff.i > 0 ? (hours = hours + ":" + timediff.i) : (minutes = false);
  for (let [key, time] of Object.entries(manual_time)) {
    explodeTime = time.split(" ");
    time = time.split(" ")[0] + time.split(" ")[1];
    checkTime = date + " " + time;
    checkIfTimingExits = await checkTimingExitsInAttendance(
      user_id,
      checkTime,
      db
    );
    let final_date_time = date + " " + time;
    let timeType = key.split("_");
    if (checkIfTimingExits == false) {
      let reason_new = reason;
      let q = await db.sequelize.query(
        `INSERT into attendance_manual ( user_id, manual_time, reason ) VALUES ( '${user_id}', '${final_date_time}', '${reason_new}')`,
        { type: QueryTypes.INSERT }
      );
      last_inserted_id = q[0];
      let timeType = key.replace("_", "");
      let dateTime1 = timeType + ":" + final_date_time;
      let firstLetterLowerCase = dateTime1[0];
      let firstLetterUpperCase = dateTime1[0].toUpperCase();
      dateTime1 = dateTime1.replace(firstLetterLowerCase, firstLetterUpperCase);
      dateTime.push(dateTime1);
      Return_msg.push(timeType + `${final_date_time} - Sent For Approval!!`);
    } else {
      timeType = timeType[0] + timeType[1];
      exist++;
      let dateTime1 =
        timeType + ":" + final_date_time + " which is already exist";
      let firstLetterLowerCase = dateTime1[0];
      let firstLetterUpperCase = dateTime1[0].toUpperCase();
      dateTime1 = dateTime1.replace(firstLetterLowerCase, firstLetterUpperCase);
      dateTime.push(dateTime1);
      Return_msg =
        timeType + ` ${checkTime} already exists. No Need to update!!`;
    }
  }
  let date_time = dateTime.join(" and ");
  if (exist == 0) {
    Return = `${date_time} - Sent For Approval!!`;
  } else if (exist == Object.entries(manual_time).length) {
    Return = `${date_time} . No Need to update!!`;
  } else {
    Return = Return_msg.join(" and ");
  }

  // /* send message to employee */
  // $hours ? $date_time .= " \n *$hours* to be requested." : false;
  // $messageBody = array(
  //     "timeType" => $time_type,
  //     "reason" => $reason,
  //     "dateTime" => $date_time
  // );
  // $slackMessageStatus = self::sendNotification( "add_manual_punch_timings", $user_id, $messageBody);

  // /* send message to admin/hr for approval*/
  // $baseURL =  $_ENV['ENV_BASE_URL'];
  // $last_inserted_ids = join(',', $last_inserted_id);
  // $approveLink = $baseURL."attendance/API_HR/api.php?action=approve_manual_attendance&id=$last_inserted_ids";
  // $approveLinkMinutesLess = $baseURL."attendance/API_HR/api.php?action=approve_manual_attendance&id=$last_inserted_ids&deductminutes=15";
  // $rejectLink = $baseURL."attendance/API_HR/api.php?action=reject_manual_attendance&id=$last_inserted_ids";

  // $bodyActionButtons[] = array(
  //     "type" => "button",
  //     "text" => "Approve",
  //     "url" => $approveLink,
  //     "style" => "primary"
  // );
  // $bodyActionButtons[] = array(
  //     "type" => "button",
  //     "text" => "Reject",
  //     "url" => $rejectLink,
  //     "style" => "danger"
  // );
  // $bodyActionButtons[] = array(
  //     "type" => "button",
  //     "text" => "Approve With 15 Minutes Less",
  //     "url" => $approveLinkMinutesLess,
  //     "style" => "primary"
  // );

  // $slackMessageStatus = self::sendNotification( "add_manual_punch_timings_admin", $user_id, $messageBody, $bodyActionButtons);

  return Return;
};

let checkTimingExitsInAttendance = async (userid, timing, db) => {
  let q = await db.sequelize.query(
    `SELECT * FROM attendance WHERE user_id = '${userid}' AND timing LIKE '%${timing}%'`,
    { type: QueryTypes.SELECT }
  );
  if (q.length > 0) {
    return true;
  }
  return false;
};

let getFileByID = async (fileId, models) => {
  try {
    if (fileId) {
      let q = await models.sequelize.query(
        `SELECT * FROM files WHERE id = ${fileId}`,
        { type: QueryTypes.SELECT }
      );
      return q;
    }
    return false;
  } catch (error) {
    throw new Error(error);
  }
};

let getUserTimeSheet = async (userid, from_date, models) => {
  try {
    let data = [];
    let newd = new Date(from_date);
    let sevenDaysBefore = newd.setDate(newd.getDate() + 6);
    let dateNow = new Date(sevenDaysBefore);
    let to_date = `${dateNow.getFullYear()}-${
      dateNow.getMonth() + 1
    }-${dateNow.getDate()}`;
    let user = await getUserInfo(userid, models);
    let username = user.username;
    let q = await models.sequelize.query(
      `SELECT * FROM timesheet WHERE user_id = '${userid}' AND date >= '${from_date}' AND date <= '${to_date}'`,
      { type: QueryTypes.SELECT }
    );
    let fromNewDate = new Date(from_date);
    let toNewDate = new Date(to_date);
    let from_month = fromNewDate.getMonth();
    let from_year = fromNewDate.getFullYear();
    let to_month = toNewDate.getMonth();
    let to_year = toNewDate.getFullYear();
    let week_dates = await _getDatesBetweenTwoDates(from_date, to_date);
    let from_month_summary,
      to_month_summary = false;
    if (from_year == to_year) {
      if (from_month == to_month) {
        from_month_summary = await getUserMonthAttendace(
          userid,
          from_year,
          from_month,
          models
        );
      } else {
        from_month_summary = await getUserMonthAttendace(
          userid,
          from_year,
          from_month,
          models
        );
        to_month_summary = await getUserMonthAttendace(
          userid,
          to_year,
          to_month,
          models
        );
      }
    } else {
      if (from_month == to_month) {
        from_month_summary = await getUserMonthAttendace(
          userid,
          from_year,
          from_month,
          models
        );
      } else {
        from_month_summary = await getUserMonthAttendace(
          userid,
          from_year,
          from_month,
          models
        );
        to_month_summary = await getUserMonthAttendace(
          userid,
          to_year,
          to_month,
          models
        );
      }
    }
    let filepath =
      process.env.ENV_BASE_URL + "attendance/uploads/timesheetDocuments/";
    if (from_month_summary) {
      for await (let summary of from_month_summary) {
        if (await inArray(summary.full_date, week_dates)) {
          summary.userid = userid;
          summary.username = username;
          summary.total_hours = 0;
          summary.comments = "";
          summary.status = "";
          summary.fileId = "";
          summary.file = "";
          for await (let row of q) {
            if (row.date == summary.full_date) {
              summary.total_hours = row.hours;
              summary.comments = row.comments;
              summary.status = row.status;
              if (!(await empty(row.fileId))) {
                let fileId = row.fileId;
                let file = await getFileByID(fileId, models);
                summary.fileId = fileId;
                summary.file = filepath + file.file_name;
              }
            }
          }
          data.push(summary);
        }
      }
    }
    if (to_month_summary) {
      for await (let summary of to_month_summary) {
        if (await inArray(summary.full_date, week_dates)) {
          summary.userid = userid;
          summary.username = username;
          summary.total_hours = 0;
          summary.comments = "";
          summary.status = "";
          summary.fileId = "";
          summary.file = "";
          for await (let row of q) {
            if (row.date == summary.full_date) {
              summary.total_hours = row.hours;
              summary.comments = row.comments;
              summary.status = row.status;
              if (!(await empty(row.fileId))) {
                let fileId = row.fileId;
                let file = await getFileByID(fileId, models);
                summary.fileId = fileId;
                summary.file = filepath + file.file_name;
              }
            }
          }

          data.push(summary);
        }
      }
    }
    return data;
  } catch (error) {
    throw new Error(error);
  }
};

let API_getUserTimeSheet = async (userid, from_date, models) => {
  try {
    let timesheet = await getUserTimeSheet(userid, from_date, models);
    let result = {
      error: 0,
      data: timesheet,
    };
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

let userTimeSheetEntry = async (data, models) => {
  try {
    let error = 0;
    let message = "";
    let hours;
    let date;
    let status;
    let comments;
    let required = ["user_id", "date", "hours"];
    let data_keys = _.keysIn(data);
    let keys = _.filter(data_keys, function (key) {
      return inArray(key, required) && _.isEmpty(data.key);
    });
    if ((await empty(keys)) == false) {
      delete data.action;
      delete data.token; // if not token not found in body delete this line
      date = data.date;
      userid = data.user_id;
      let q = await models.sequelize.query(
        `SELECT * FROM timesheet WHERE date = '${date}' AND user_id = ${userid}`,
        { type: QueryTypes.SELECT }
      );
      if (_.isEmpty(q)) {
        if (
          await models.sequelize.query(
            `insert into timesheet 
            (user_id, date, hours, comments, fileId, applied_on) VALUES 
            (${data.user_id}, '${date}', ${data.hours}, '${data.comments}', ${data.fileId}, '${data.applied_on}')`,
            { type: QueryTypes.INSERT }
          )
        ) {
          hours = q.hours;
          date = q.date;
          comments = data.comments;
          message = "Time Sheet Updated";
        } else {
          error = 1;
          message = "DATA insertion failed";
        }
      } else {
        if ((q.submitted && q.status) != "Rejected") {
          error = 1;
          message = "Entry already submitted, you cam't edit";
        } else {
          id = q.id;
          hours = data.hours;
          comments = data.comments;
          fileId = data.fileId;
          status = q.status;
          let queryTo = "UPDATE timesheet set hours =" + hours + "";
          if (comments) {
            await models.sequelize.query(
              (queryTo +=
                ", comments =" +
                comments +
                "WHERE date =" +
                date +
                "AND user_id =" +
                userid),
              { type: QueryTypes.UPDATE }
            );
          }
          if (fileId) {
            await models.sequelize.query(
              (queryTo +=
                ", fileId =" +
                fileId +
                "WHERE date =" +
                date +
                "AND user_id =" +
                userid),
              { type: QueryTypes.UPDATE }
            );
          }
          if (status) {
            await models.sequelize.query(
              (queryTo +=
                ", status =" +
                status +
                "WHERE date =" +
                date +
                "AND user_id =" +
                userid),
              { type: QueryTypes.UPDATE }
            );
          }
          if (q[1] == 1) {
            message = "time sheet updated";
          } else {
            error = 1;
            message = "time sheet update failed";
          }
        }
      }
    } else {
      error = 1;
      message = _.join(", ", keys) + " cant be empty or null";
    }
    let result = {
      error: error,
      message: message,
    };
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

let API_userTimeSheetEntry = async (data, models) => {
  try {
    {
      let result = await userTimeSheetEntry(data, models);
      return result;
    }
  } catch (error) {
    throw new Error(error);
  }
};

let getMonday = async (d) => {
  d = new Date(d);
  let day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

let getSunday = async (d) => {
  d = new Date(d);
  let day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -7 : 0); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

let submitUserTimeSheet = async (userid, monday, models) => {
  try {
    let error = 1;
    let message = "Time sheet already submitted";
    let enable_submit = false;
    let d = await getMonday(monday);
    let sd = await getSunday(monday);
    let date;
    monday = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    let sunday = `${sd.getFullYear()}-${sd.getMonth() + 1}-${sd.getDate()}`;
    let timesheet = await getUserTimeSheet(userid, monday, models);
    if (timesheet.length > 0) {
      for await (let entry of timesheet) {
        if (entry.day_type == "WORKING_DAY" && entry.status == "Saved") {
          date = entry.full_date;
          let q = await models.sequelize.query(
            `UPDATE timesheet set submitted = 1, status = 'Pending', updated_at = CURRENT_TIMESTAMP WHERE user_id = '${userid}' AND date = '${date}'`,
            { type: QueryTypes.UPDATE }
          );
          if (q[1] == 1) {
            error = 0;
            message = "Time Sheet Updated and Submit Sucessfully.";
          }
        }
      }
      if ((error = 0)) {
        let baseURL = process.env.ENV_BASE_URL;
        let approveLink = `${baseURL}attendance/API_HR/api.php?action=update_user_full_timesheet_status&from_date=${monday}&user_id=${userid}&status=Approved`;
        let rejectLink = `${baseURL}attendance/API_HR/api.php?action=update_user_full_timesheet_status&from_date=${monday}&user_id=${userid}&status=Rejected`;
        //   let format_date =
      }
    } else {
      error = 1;
      message = "No Time Sheet has been found";
    }
    let result = {
      error: error,
      message: message,
    };
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

let API_submitUserTimeSheet = async (userid, monday, models) => {
  try {
    let result = await submitUserTimeSheet(userid, monday, models);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

let getUserPendingTimeSheetMonthly = async (userid, year, month, models) => {
  try {
    let date_like = year + "-" + month;
    let q = await models.sequelize.query(
      `SELECT * FROM timesheet WHERE user_id = ${userid} AND date LIKE '%${date_like}%' AND submitted = 1 AND status = 'Pending' ORDER BY updated_at DESC`,
      { type: QueryTypes.SELECT }
    );
    return q;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

let pendingTimeSheets = async (year, month, models) => {
  try {
    let timesheets = [];
    let sorted_timesheets = [];
    let latest_submit_by_user = [];
    let users = await getEnabledUsersList((sortedBy = false), models);
    for await (let user of users) {
      if (!(await empty(user.user_Id))) {
        let userid = user.user_Id;
        let timesheet = await getUserPendingTimeSheetMonthly(
          userid,
          year,
          month,
          models
        );
        let month_summary = await getUserMonthAttendace(
          userid,
          year,
          month,
          models
        );
        let user_timesheet = [];
        if (timesheet.length > 0) {
          latest_submit_by_user[userid] = timesheet[0].update_at;
          let filepath =
            process.env.ENV_BASE_URL + "attendance/uploads/timesheetDocuments/";
          for await (let timesheet_entry of timesheet) {
            let date = timesheet_entry.date;
            timesheet_entry.total_hours = timesheet_entry.hours;
            delete timesheet_entry.hours;
            timesheet_entry.file = "";
            if (!(await empty(timesheet_entry.fileId))) {
              let file = await getFileByID(timesheet_entry.fileId, models);
              timesheet_entry.file = filepath + file.file_name;
            }
            let summary = _.keysIn(
              _.filter(month_summary, function (iter) {
                return iter.full_date == date;
              })
            );
            let timesheet_entry_data = _.merge(summary[0], timesheet_entry);
            user_timesheet.push(timesheet_entry_data);
          }
          user.timesheet = user_timesheet;
          timesheets.push(user);
        }
      }
    }
    _.sortBy(latest_submit_by_user, function (o) {
      o;
    });

    let userIds = _.keysIn(latest_submit_by_user);
    for await (let userid of userIds) {
      for await (let timesheet of timesheets) {
        if (userid == timesheet.user_Id) {
          sorted_timesheets.push(timesheet);
        }
      }
    }
    return sorted_timesheets;
  } catch (error) {
    throw new Error(error);
  }
};

let API_pendingTimeSheets = async (year, month, models) => {
  try {
    let error = 0;
    let timesheets = await pendingTimeSheets(year, month, models);
    let result = {
      error: error,
      data: timesheets,
    };
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

let getUserSubmittedTimesheet = async (userid, monday, models) => {
  try {
    let data = [];
    let d = await getMonday(monday);
    let sd = await getSunday(monday);
    monday = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    let sunday = `${sd.getFullYear()}-${sd.getMonth() + 1}-${sd.getDate()}`;
    console.log(monday, sunday, "------------------------------");
    let q = await models.sequelize.query(
      `SELECT * FROM timesheet WHERE user_id = '${userid}' AND date >= '${monday}' AND date <= '${sunday}' AND submitted = 1`,
      { type: QueryTypes.SELECT }
    );
    console.log(q);
    if (q.length > 0) {
      let fromNewDate = new Date(monday);
      let toNewDate = new Date(sunday);
      let from_month = fromNewDate.getMonth();
      let from_year = fromNewDate.getFullYear();
      let to_month = toNewDate.getMonth();
      let to_year = toNewDate.getFullYear();
      let week_dates = await _getDatesBetweenTwoDates(monday, sunday);
      let from_month_summary,
        to_month_summary = false;
      if (from_year == to_year) {
        if (from_month == to_month) {
          from_month_summary = await getUserMonthAttendace(
            userid,
            from_year,
            from_month,
            models
          );
        } else {
          from_month_summary = await getUserMonthAttendace(
            userid,
            from_year,
            from_month,
            models
          );
          to_month_summary = await getUserMonthAttendace(
            userid,
            to_year,
            to_month,
            models
          );
        }
      } else {
        if (from_month == to_month) {
          from_month_summary = await getUserMonthAttendace(
            userid,
            from_year,
            from_month
          );
        } else {
          from_month_summary = await getUserMonthAttendace(
            userid,
            from_year,
            from_month,
            models
          );
          to_month_summary = await getUserMonthAttendace(
            userid,
            to_year,
            to_month,
            models
          );
        }
      }
      let filepath =
        process.env.ENV_BASE_URL + "attendance/uploads/timesheetDocuments/";
      if (from_month_summary) {
        for await (let summary of from_month_summary) {
          if (await inArray(summary.full_date, week_dates)) {
            summary.userid = userid;
            summary.username = username;
            summary.total_hours = 0;
            summary.comments = "";
            summary.status = "";
            summary.fileId = "";
            summary.file = "";
            for await (let row of q) {
              if (row.date == summary.full_date) {
                summary.total_hours = row.hours;
                summary.comments = row.comments;
                summary.status = row.status;
                if (!_.isEmpty(row.fileId)) {
                  let fileId = row.fileId;
                  let file = await getFileByID(row.fileId, models);
                  summary.fileId = fileId;
                  summary.file = filepath + file.file_name;
                }
              }
            }
            data.push(summary);
          }
        }
      }
      if (to_month_summary) {
        for await (let summary of to_month_summary) {
          if (await inArray(summary.full_date, week_dates)) {
            summary.userid = userid;
            summary.username = username;
            summary.total_hours = 0;
            summary.comments = "";
            summary.status = "";
            summary.fileId = "";
            summary.file = "";
            for await (let row of q) {
              if (row.data == summary.full_date) {
                summary.total_hours = row.hours;
                summary.comments = row.comments;
                summary.status = row.status;
                if (!_.isEmpty(row.fileId)) {
                  let fileId = row.fileId;
                  let file = await getFileByID(row.fileId, models);
                  summary.fileId = fileId;
                  summary.file = filepath + file.file_name;
                }
              }
            }
            data.push(summary);
          }
        }
      }
    }
    return data;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

let API_getUserSubmittedTimesheet = async (userid, monday, models) => {
  try {
    let result = {};
    let timesheet = await getUserSubmittedTimesheet(userid, monday, models);
    if (timesheet.length > 0) {
      result.error = 0;
      result.data = timesheet;
    } else {
      result.error = 1;
      result.message = "there is no timesheet submitted for the week";
    }
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

let updateUserTimeSheetStatus = async (userid, date, status, models) => {
  try {
    let status = status ? status : "Pending";
    let message = "";
    let error = 0;
    let approved_on = false;
    let q = await models.sequelize.query(
      `SELECT * FROM timesheet WHERE user_id = ${userid} AND date = '${date}'`,
      { type: QueryTypes.SELECT }
    );
    if (!_.isEmpty(q[0]) && Object.keys(q[0]).length > 0) {
      if (q[0].status != "Approved") {
        if (status == "Approved") {
          let hours = q[0].hours;
          let entry_time = "10:30 AM";
          let now = new Date();
          let nowDateTime = now.toISOString();
          let nowDate = nowDateTime.split("T")[0];
          let target = new Date(nowDate + entry_time);
          let lastTime = target + 60 * 60 * hours;
          let exit_time = moment(lastTime).format("LT");
          let inTime = date + " " + entry_time;
          let outTime = date + " " + exit_time;
          let punch_in = moment(inTime, "MM DD YYYY hh:mm:ss A");
          let punch_out = moment(outTime, "MM DD YYYY hh:mm:ss A");
          await insertUserPunchTime(userid, punch_in);
          await insertUserPunchTime(userid, punch_out);
          approved_on = moment("YYYY-MM-DD");
        }
        let qString =
          "UPDATE timesheet SET status ='" +
          status +
          "', updated_at ='" +
          Date.now();
        if (approved_on) {
          qString += "' , approved_on ='" + approved_on + "'";
        }
        qString +=
          "where user_id ='" +
          userid +
          " AND date >= '" +
          monday_date +
          "' AND date <= '" +
          sunday_date +
          "'";
        if (q[1] == 1) {
          error = 0;
          message = `Your time sheet entry for date ${date} has been $status`;
        } else {
          error = 1;
          message = "Update Failed";
        }
      } else {
        error = 1;
        message = `The Time Sheet Entry for date ${date} is already Approved`;
      }
      if (error == 0) {
        // let format_date = send notification part
      }
    } else {
      error = 1;
      message = "Timesheet Entry Not Found";
    }
    let result = {
      error: error,
      message: message,
    };
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

let API_updateUserTimeSheetStatus = async (userid, date, status, models) => {
  try {
    let result = await updateUserTimeSheetStatus(userid, date, status, models);
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

let updateUserFullTimeSheetStatus = async (userid, monday, status, models) => {
  try {
    let error = 1;
    let message = "";
    let approved_on = false;
    status = status ? status : "Pending";
    let timesheet = await getUserSubmittedTimesheet(userid, monday, models);
    let timesheet_monday = timesheet[0];
    let timesheet_sunday = timesheet.length - 1;
    let monday_date = timesheet_monday.full_date;
    let sunday_date = timesheet_sunday.full_date;
    if (timesheet.length > 0) {
      if (status == "Approved") {
        for await (let day of timesheet) {
          if (day.total_hours > 0) {
            let date = day.full_date;
            let hours = day.total_hours;
            let now = new Date();
            let nowDateTime = now.toISOString();
            let nowDate = nowDateTime.split("T")[0];
            let entry_time = "10:30 AM";
            let target = new Date(nowDate + entry_time);
            let lastTime = target + 60 * 60 * hours;
            let exit_time = moment(lastTime).format("LT");
            let inTime = date + " " + entry_time;
            let outTime = date + " " + exit_time;
            let punch_in = moment(inTime, "MM DD YYYY hh:mm:ss A");
            let punch_out = moment(outTime, "MM DD YYYY hh:mm:ss A");
            await insertUserPunchTime(userid, punch_in);
            await insertUserPunchTime(userid, punch_out);
          }
        }
        approved_on = moment("YYYY-MM-DD");
      }
      let qString =
        "UPDATE timesheet SET status ='" +
        status +
        "', updated_at ='" +
        Date.now();
      if (approved_on) {
        qString += "' , approved_on ='" + approved_on + "'";
      }
      qString +=
        "where user_id ='" +
        userid +
        " AND date >= '" +
        monday_date +
        "' AND date <= '" +
        sunday_date +
        "'";
      if (q[1] == 1) {
        error = 0;
        message = `Time Sheet from ${monday_date} to ${sunday_date} has been ${status}`;
      } else {
        message = "Time sheet update failed";
      }
    } else {
      message = "No time sheet found";
    }
    if (error == 0) {
      // let format_date = send notification part
    }
    let result = {
      error: error,
      message: message,
    };
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

let API_updateUserFullTimeSheetStatus = async (
  userid,
  monday,
  status,
  models
) => {
  try {
    let result = await updateUserFullTimeSheetStatus(
      userid,
      monday,
      status,
      models
    );
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  API_updateUserFullTimeSheetStatus,
  API_updateUserTimeSheetStatus,
  API_getUserSubmittedTimesheet,
  API_pendingTimeSheets,
  API_submitUserTimeSheet,
  API_getUserTimeSheet,
  API_userTimeSheetEntry,
  getAllUserPrevMonthTime,
  updateDayWorkingHours,
  multipleAddUserWorkingHours,
  getWorkingHoursSummary,
  addUserWorkingHours,
  geManagedUserWorkingHours,
  getEmployeeCurrentMonthFirstWorkingDate,
  insertUserInOutTimeOfDay,
  addManualAttendance,
};
