const { QueryTypes } = require("sequelize");
const md5 = require("md5")
const db = require("./db");
const {intervalToDuration} =require('date-fns')
// const createPeriod = require("date-period");
const { getUserInfo } = require("./allFunctions")
const { getSalaryInfo, getEmployeeCompleteInformation, getUserprofileDetail,getAllUserDetail,getUserlatestSalary } = require("./employeeFunction")
const {
  getGenericMonthSummary,
  getUserMonthAttendaceComplete,
  getUserMonthPunching,
  getUserMonthLeaves,
  _getPreviousMonth,
  _getDatesBetweenTwoDates,
  getDaysOfMonth,
} = require("./leavesFunctions");
const { isArray, result } = require("lodash");

let deleteUserSalary = async (userid, salaryid, db) => {
  let r_error = 1;
  let r_message = "";
  let r_data = {};
  let q = await db.sequelize.query(
    `DELETE FROM salary WHERE id = '${salaryid}'`,
    { type: QueryTypes.DELETE }
  );
  let q2 = await db.sequelize.query(
    `DELETE FROM salary_details WHERE salary_id = '${salaryid}'`,
    { type: QueryTypes.DELETE }
  );
  r_error = 0;
  r_message = "Salary deleted successfully";
  r_data["message"] = r_message;
  let Return = {};
  Return["error"] = r_error;
  Return["data"] = r_data;
  return Return;
};

let getUserManagePayslipBlockWise = async (userid,year,month,extra_arrear,arrear_for_month, db,req,checkPreviousMonthPayslip = false) => {
  let salaryBlockWise = await getSalaryBlocks(userid,year,month,extra_arrear,arrear_for_month,checkPreviousMonthPayslip,db,req);
  return salaryBlockWise;
};
let getSalaryBlocks = async (userid,year,month,extra_arrear,arrear_for_month,checkPreviousMonthPayslip,db,req) => {
  let DEBUG = false;
  let debugData = {};
  let r_error = 1;
  let r_data = {};
  let r_message = "";
  if (DEBUG) {
    debugData.YEAR = year;
    debugData.Month = month;
  }
  let date = year + "-" + month + "-01";
  let month_name = new Date(date).toLocaleString("default", { month: "long" });
  salaries = await getSalaryInfo(userid, db, "first_to_last", date);

  let genericMonthDays = await getGenericMonthSummary(year, month, userid, db);
  let MONTH_TOTAL_WORKING_DAYS = await getTotalWorkingDays(
    year,
    month,
    userid,
    db
  );

  /* emp working dayss without punch time */
  let empWithoutPunchDaysData = await getEmployeeWorkingDaysWithoutPunchTime(
    userid,
    year,
    month,
    db,
    req,
    arrear_for_month
  );
  let employeeWorkingDaysWithoutPunchTime =
    empWithoutPunchDaysData["pending_leaves"];
  let emp_toshow_pending_leaves =
    empWithoutPunchDaysData["toshow_pending_leaves"];
  let emp_toshow_days_before_joining =
    empWithoutPunchDaysData["toshow_days_before_joining"];
  let emp_applied_pending_leaves =
    empWithoutPunchDaysData["applied_pending_leaves"];

  //get bonus of salary month form payslips table.
  let bonus = await getUserBonus(userid, year, month, db);

  //get misc deduction of salary month form payslips table.
  misc_deduction = await getUserMiscDeduction(userid, year, month, db);

  /* final leave balance info */
  let balance_leave = 0;
  let employeePreviousPayslips = await getUserPayslipInfo(userid, db);

  if (employeePreviousPayslips.length > 0) {
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let current_month_previous_month_year = await _getPreviousMonth(
      currentYear,
      currentMonth
    );
    let current_month_previous_year = current_month_previous_month_year["year"];
    let current_month_previous_month =
      current_month_previous_month_year["month"];
    if (
      current_month_previous_year == year &&
      current_month_previous_month == month
    ) {
      // start old logic
      if (employeePreviousPayslips[0]["month"] == month) {
        if (employeePreviousPayslips[1]["final_leave_balance"] == "") {
          balance_leave = 0;
        } else {
          balance_leave = employeePreviousPayslips[1]["final_leave_balance"];
        }
      } else {
        if (employeePreviousPayslips[0]["final_leave_balance"] == "") {
          balance_leave = 0;
        } else {
          balance_leave = employeePreviousPayslips[0]["final_leave_balance"];
        }
      }
      // end old logic
    } else {
      // start new logic
      previousMonthDetails = await _getPreviousMonth(year, month);
      balance_leave_check_of_month = previousMonthDetails["month"];
      balance_leave_check_of_year = previousMonthDetails["year"];
      for (ps of employeePreviousPayslips) {
        if (
          ps["year"] == balance_leave_check_of_year &&
          ps["month"] == balance_leave_check_of_month
        ) {
          if (ps["final_leave_balance"] != "") {
            balance_leave = ps["final_leave_balance"];
            break;
          }
        }
      } // end new logic
    }
  }
  /* final leave balance info */
  /* get employee month leave info && get employee total no. of leave taken in month*/
  let current_month_leave = 0;
  let current_month_leave_days = [];
  let c = await getUserMonthLeaves(userid, year, month, db);
// console.log(c)
  if (c.length > 0) {
    for (let [key,v] of Object.entries(c)) {
      console.log(v)
      let vStatus = v["status"].toLowerCase();
      if (vStatus == "approved" || vStatus == "pending") {
        if (
          vStatus == "approved" &&
          v["leave_type"] &&
          (v["leave_type"].toLowerCase() == "rh compensation" ||
            v["leave_type"].toLowerCase() == "restricted")
        ) {
        } else {
          // $current_month_leave = $current_month_leave + $v['no_of_days'];
          // $user_salaryinfo['days_present'] = $user_salaryinfo['days_present'] - $v['no_of_days'];
          // if ($v['no_of_days'] < 1) {
          //     $current_month_leave = $current_month_leave + $v['no_of_days'];
          //     $user_salaryinfo['days_present'] = $user_salaryinfo['days_present'] - $v['no_of_days'];
          // } else {
          //     $current_month_leave = $current_month_leave + $v['no_of_days'];
          // }
          /* log each days fall in leave from and to date */
          let daysOfLeaves = await _getDatesBetweenTwoDates(
            v["from_date"],
            v["to_date"]
          );
          if (daysOfLeaves.length > 0) {
            if (daysOfLeaves.length == 1) {
              if (new Date(daysOfLeaves[0]).getMonth() + 1 == month) {
                if (!daysOfLeaves[0] in current_month_leave_days) {
                  current_month_leave_days[daysOfLeaves[0]] = v["no_of_days"];
                  current_month_leave = current_month_leave + v["no_of_days"];
                  user_salaryinfo["days_present"] =
                    user_salaryinfo["days_present"] - v["no_of_days"];
                }
              }
            } else {
              for (let [key, dl] of Object.entries(daysOfLeaves)) {
                if (new Date(dl).getMonth() + 1 == month) {
                  if (!(dl in current_month_leave_days)) {
                    current_month_leave_days[dl] = 1;
                    current_month_leave += 1;
                    user_salaryinfo["days_present"] =
                      user_salaryinfo["days_present"] - 1;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  let temp_current_month_leave_days = current_month_leave_days;
  /* get employee month leave info && get employee total no. of leave taken in month*/

  // print_r($current_month_leave_days)
  if (DEBUG) {
    (debugData.balance_leave = balance_leave),
      (debugData.current_month_leave = current_month_leave);
  }

  let daysPresent = await getUserMonthPunching(userid, year, month, db);
  if (daysPresent.length > 0) {
    for (let [key, db] of daysPresent) {
      // month_padded = sprintf("%02d", month);
      // day["full_date"] = "$year-$month_padded-$key";
      // daysPresent[key] = day;
    }
  }
  //get employee profile detail.
  let res0 = await getUserprofileDetail(userid, req, db);

  // print_r($genericMonthDays);
  // print_r($daysPresent);

  let blocks = {};
  let rawBlocks = {};
  let validMonthSalaries = {};

  if (DEBUG) {
    debugDate.SalariesList = salaries;
  }

  if (Array.isArray(salaries) && salaries.length > 0) {
    let salariesForBlocksCalculation = {};

    for (let [key, salary] of Object.entries(salaries)) {
      // print_r($salary);
      let salaryApplicableFromDate = salary["applicable_from"];
      let salaryApplicableTillDate = salary["applicable_till"];
      let daysBWfromAndTo = await _getDatesBetweenTwoDates(
        salaryApplicableFromDate,
        salaryApplicableTillDate
      );
      tempDatesBreakUpMonthYear = {};
      for (let [key, date] of Object.entries(daysBWfromAndTo)) {
        let date_month = new Date(date).getMonth() + 1;
        let date_year = new Date(date).getFullYear();
        let dy_key = date_year + "_" + date_month;
        if (tempDatesBreakUpMonthYear[dy_key]) {
          tempDatesBreakUpMonthYear[dy_key]["applicable_till"] = date;
        } else {
          salary["applicable_from"] = date;
          tempDatesBreakUpMonthYear[dy_key] = salary;
        }
      }
      // print_r($tempDatesBreakUpMonthYear);
      // print_r($daysBWfromAndTo);

      for (let [key, value] of Object.entries(tempDatesBreakUpMonthYear)) {
        salariesForBlocksCalculation.push(value);
      }
    }

    // print_r($salariesForBlocksCalculation);

    // die;

    // foreach ($salaries as $key => $salary) {
    for (let [key, salary] of Object.entries(salariesForBlocksCalculation)) {
      let salaryApplicableFromDate = salary["applicable_from"];
      salaryApplicableTillDate = salary["applicable_till"];
      applicableMonth = new Date(salaryApplicableFromDate).getMonth() + 1;
      applicableYear = new Date(salaryApplicableFromDate).getFullYear();
      if (applicableYear == year && applicableMonth == month) {
        validMonthSalaries.push(salary);
        rawBlocks[new Date(salaryApplicableFromDate).getTime()] = {
          from: salaryApplicableFromDate,
          till: salaryApplicableTillDate,
          salary: salary,
        };
      }
    }
  }

  if (DEBUG) {
    debugData.rawSalariesblock = rawBlocks;
  }
  // If salary not updated upto now then take last block salary for further calculation
  if (!rawBlocks) {
    if (salariesForBlocksCalculation.length > 0) {
      let last_block_salary = end(salariesForBlocksCalculation);
      let from = last_block_salary["applicable_from"];
      let till = last_block_salary["applicable_till"];
      let aData = new Date(from).getTime();
      rawBlocks[aData] = {
        from: from,
        till: till,
        salary: last_block_salary,
      };
    }
  }
  if (rawBlocks.length > 0) {
    rawBlocks.sort();
    let tempRawBlock = [];
    for (let [key, value] of Object.entries(rawBlocks)) {
      tempRawBlock.push(value);
    }

    let monthAllDays = await getDaysOfMonth(year, month);
    let endDateOfMonth = "";
    if (Array.isArray(monthAllDays) && monthAllDays.length > 0) {
      endDateOfMonth = monthAllDays[monthAllDays.length]["full_date"];
    }
    // print_r($monthAllDays);

    for (let [key, value] of Object.entries(tempRawBlock)) {
      let user_salaryinfo = value["salary"];
      let month_leaves_allocated = user_salaryinfo["leaves_allocated"];
      let start = value["from"];
      if (tempRawBlock[key + 1] && tempRawBlock[key + 1]["from"]) {
        let tempD = new Date(tempRawBlock[key + 1]["from"]).getDate() - 1;
        tempD = new Date(tempRawBlock[key + 1]["from"]).setDate();
        let end = new Date(tempD);
        // let end = date('Y-m-d', strtotime('-1 day', strtotime(tempRawBlock[key+1]['from'])));
      } else {
        end = endDateOfMonth;
      }
      let genericDays = await _getDatesBetweenTwoDates(start, end);
      /* generic working days */
      let workingDays = [];
      let block_total_working_days = 0;

      let block_days_without_punch = array_values(
        _.intersection(genericDays, emp_toshow_pending_leaves)
      );

      for (let [key, day] of Object.entries(genericMonthDays)) {
        if (day["day_type"] == "WORKING_DAY") {
          if (in_array(day["full_date"], genericDays)) {
            workingDays.push(day);
            block_total_working_days++;
          }
        }
      }

      /* days present */
      let presentDays = [];
      let days_present = 0;

      for (let [key, day] of Object.entries(daysPresent)) {
        if (genericDays.includes(day["full_date"])) {
          presentDays.push(day);
          days_present++;
        }
      }
      /*calculate leaves allocated for this block*/
      block_leaves_allocated =
        (month_leaves_allocated / MONTH_TOTAL_WORKING_DAYS) *
        block_total_working_days;
      block_leaves_allocated = Math.round(block_leaves_allocated, 2);
      /*calculate block balance leave*/
      block_balance_leave =
        (balance_leave / MONTH_TOTAL_WORKING_DAYS) * block_total_working_days;
      block_balance_leave = Math.round(block_balance_leave, 2);
      /*calculate block current month leave */
      block_current_month_leave = 0;
      block_current_month_leave_days = [];
      if (temp_current_month_leave_days.length > 0) {
        for (let [key, value] of Object.entries(workingDays)) {
          if (value["full_date"] in current_month_leave_days) {
            block_current_month_leave_days.push(value["full_date"]);
            block_current_month_leave +=
              current_month_leave_days[value["full_date"]];
          }
        }
      }
      /*get final leave balance of employee*/
      leaves =
        block_balance_leave -
        block_current_month_leave +
        block_leaves_allocated;
      unpaid_leave = 0;
      if (leaves >= 0) {
        paid_leave = block_current_month_leave;
        unpaid_leave = 0;
      }
      if (leaves < 0) {
        paid_leave = block_current_month_leave - Math.abs(leaves);
        unpaid_leave = Math.abs(leaves);
      }

      // consider not appllied leaves as unpaid leave
      if (block_days_without_punch.length > 0) {
        unpaid_leave += block_days_without_punch.length;
      }

      //get employee month salary details
      actual_salary_detail = salary_detail = await getSalaryDetail(
        user_salaryinfo["id"],
        (userid = false),
        db
      );

      //per day calculate salary
      pday_basic = salary_detail["Basic"] / MONTH_TOTAL_WORKING_DAYS;
      pday_hra = salary_detail["HRA"] / MONTH_TOTAL_WORKING_DAYS;
      pday_conve = salary_detail["Conveyance"] / MONTH_TOTAL_WORKING_DAYS;
      pday_med = salary_detail["Medical_Allowance"] / MONTH_TOTAL_WORKING_DAYS;
      pday_spl = salary_detail["Special_Allowance"] / MONTH_TOTAL_WORKING_DAYS;
      pday_arrear = salary_detail["Arrears"] / MONTH_TOTAL_WORKING_DAYS;

      // per day calculate dedcutions
      pday_tds = salary_detail["TDS"] / MONTH_TOTAL_WORKING_DAYS;
      pday_misc = salary_detail["Misc_Deductions"] / MONTH_TOTAL_WORKING_DAYS;
      pday_advance = salary_detail["Advance"] / MONTH_TOTAL_WORKING_DAYS;
      pday_loan = salary_detail["Loan"] / MONTH_TOTAL_WORKING_DAYS;
      pday_epf = salary_detail["EPF"] / MONTH_TOTAL_WORKING_DAYS;

      user_salaryinfo["year"] = year;
      user_salaryinfo["month"] = month;
      user_salaryinfo["month_name"] = month_name;
      user_salaryinfo["name"] = res0["name"];
      user_salaryinfo["dateofjoining"] = res0["dateofjoining"];
      user_salaryinfo["jobtitle"] = res0["jobtitle"];

      // get employee actual salary total earning and total deduction.
      actual_salary_detail["total_earning"] =
        actual_salary_detail["Basic"] +
        actual_salary_detail["HRA"] +
        actual_salary_detail["Conveyance"] +
        actual_salary_detail["Medical_Allowance"] +
        actual_salary_detail["Special_Allowance"] +
        actual_salary_detail["Arrears"];
      actual_salary_detail["total_deduction"] =
        salary_detail["EPF"] +
        actual_salary_detail["Loan"] +
        actual_salary_detail["Advance"] +
        actual_salary_detail["Misc_Deductions"] +
        actual_salary_detail["TDS"];
      //employee actual net salary
      actual_salary_detail["net_salary"] =
        actual_salary_detail["total_earning"] -
        actual_salary_detail["total_deduction"];

      //final salary calculate
      final_basic =
        block_total_working_days * pday_basic - pday_basic * unpaid_leave;
      final_hra = block_total_working_days * pday_hra - pday_hra * unpaid_leave;
      final_conve =
        block_total_working_days * pday_conve - pday_conve * unpaid_leave;
      final_med = block_total_working_days * pday_med - pday_med * unpaid_leave;
      final_spl = block_total_working_days * pday_spl - pday_spl * unpaid_leave;
      final_arrear =
        block_total_working_days * pday_arrear - pday_arrear * unpaid_leave;

      // final calculate deductions
      final_tds = block_total_working_days * pday_tds;
      final_misc = block_total_working_days * pday_misc;
      final_advance = block_total_working_days * pday_advance;
      final_loan = block_total_working_days * pday_loan;
      final_epf = block_total_working_days * pday_epf;

      /*
        final_basic = salary_detail['Basic'] - ( pday_basic * unpaid_leave);
        final_hra = salary_detail['HRA'] - ( pday_hra * unpaid_leave);
        final_conve = salary_detail['Conveyance'] - ( pday_conve * unpaid_leave);
        final_med = salary_detail['Medical_Allowance'] - ( pday_med * unpaid_leave);
        final_spl = salary_detail['Special_Allowance'] - ( pday_spl * unpaid_leave);
        final_arrear = salary_detail['Arrears'] - ( pday_arrear * unpaid_leave);
        */

      //array formation with values to display on hr system.
      salary_detail["Basic"] =
        final_basic * 1 > 0 ? Math.round(final_basic, 2) : 0;
      salary_detail["HRA"] = final_hra * 1 > 0 ? Math.round(final_hra, 2) : 0;
      salary_detail["Conveyance"] =
        final_conve * 1 > 0 ? Math.round(final_conve, 2) : 0;
      salary_detail["Medical_Allowance"] =
        final_med * 1 > 0 ? Math.round(final_med, 2) : 0;
      salary_detail["Special_Allowance"] =
        final_spl * 1 > 0 ? Math.round(final_spl, 2) : 0;
      salary_detail["Arrears"] =
        final_arrear * 1 > 0 ? Math.round(final_arrear, 2) : 0;

      salary_detail["TDS"] = final_tds * 1 > 0 ? Math.round(final_tds, 2) : 0;
      salary_detail["Misc_Deductions"] =
        final_misc * 1 > 0 ? Math.round(final_misc, 2) : 0;
      salary_detail["Advance"] =
        final_advance * 1 > 0 ? Math.round(final_advance, 2) : 0;
      salary_detail["Loan"] =
        final_loan * 1 > 0 ? Math.round(final_loan, 2) : 0;
      salary_detail["EPF"] = final_epf * 1 > 0 ? Math.round(final_epf, 2) : 0;

      total_earning =
        salary_detail["Basic"] +
        salary_detail["HRA"] +
        salary_detail["Conveyance"] +
        salary_detail["Medical_Allowance"] +
        salary_detail["Special_Allowance"] +
        salary_detail["Arrears"] +
        salary_detail["bonus"];
      total_deduction =
        salary_detail["EPF"] +
        salary_detail["Loan"] +
        salary_detail["Advance"] +
        salary_detail["Misc_Deductions"] +
        salary_detail["TDS"] +
        salary_detail["misc_deduction2"];
      net_salary = total_earning - total_deduction;

      // salary can't be negative
      if (net_salary < 0) {
        net_salary = 0;
      }

      final_leave_balance =
        block_balance_leave +
        block_leaves_allocated -
        block_current_month_leave;
      if (final_leave_balance <= 0) {
        final_leave_balance = 0;
      }

      if (DEBUG) {
        debugData.MONTH_TOTAL_WORKING_DAYS = MONTH_TOTAL_WORKING_DAYS;
        debugData.block_total_working_days = block_total_working_days;
        debugData.month_leaves_allocated = month_leaves_allocated;
        debugData.days_present = days_present;
        debugData.block_leaves_allocated = block_leaves_allocated;
        debugData.block_balance_leave = block_balance_leave;
        debugData.block_current_month_leave = block_current_month_leave;
        debugData.leaves = leaves;
        debugData.paid_leave = paid_leave;
        debugData.unpaid_leave = unpaid_leave;
        // print_r(user_salaryinfo);
      }

      salary_detail["misc_deduction2"] = "will add in final array";
      salary_detail["bonus"] = "will add in final array";

      user_data_for_payslip = {
        month_name: month_name,
        total_working_days: block_total_working_days,
        days_present: days_present,
        total_earning: total_earning,
        total_deduction: total_deduction,
        net_salary: net_salary,
        paid_leaves: paid_leave,
        unpaid_leaves: unpaid_leave,
        total_leave_taken: block_current_month_leave,
        leave_balance: block_balance_leave,
        final_leave_balance: final_leave_balance,
        extra_arrear: "Will add in final array",
        arrear_for_month: "will add in final array",
        salary_detail: salary_detail,
      };

      user_data_for_payslip = user_salaryinfo.concat(user_data_for_payslip);

      // user_salaryinfo = array(
      //     "start" => start,
      //     "end" => end,
      //     "salary" =>  value['salary'],

      //     "month_total_working_days" => MONTH_TOTAL_WORKING_DAYS,
      //     "total_days" => sizeof(genericDays),
      //     "total_working_days" => block_total_working_days,
      //     "days_present" => days_present,

      //     "salary_detail" => salary_detail,

      //     "total_earning" => round(total_earning, 2),
      //     "total_deduction" => round(total_deduction, 2),
      //     "net_salary" => round(net_salary, 2),

      //     // "days" => genericDays,
      //     // "workingDays" => workingDays,
      //     // "presentDays" => presentDays

      // );;

      blocks.push(user_data_for_payslip);
    }
  }
  let finalArray = [];
  if (blocks.length > 0) {
    user_data_for_payslip = blocks[blocks.length - 1];

    total_working_days = 0;
    days_present = 0;
    total_earning = 0;
    total_deduction = 0;
    net_salary = 0;
    paid_leaves = 0;
    unpaid_leaves = 0;
    total_leave_taken = 0;
    leave_balance = 0;
    final_leave_balance = 0;

    bs_EPF = 0;
    bs_Loan = 0;
    bs_Advance = 0;
    bs_Misc_Deductions = 0;
    bs_TDS = 0;
    bs_Increment_Amount = 0;
    bs_Arrears = 0;
    bs_Basic = 0;
    bs_HRA = 0;
    bs_Conveyance = 0;
    bs_Medical_Allowance = 0;
    bs_Special_Allowance = 0;
    bs_total_holding_amount = 0;
    bs_total_earning = 0;
    bs_total_deduction = 0;
    bs_total_net_salary = 0;
    bs_misc_deduction2 = 0;
    bs_bonus = 0;

    for (let [key, block] of Object.entries(blocks)) {
      total_working_days += block["total_working_days"];
      days_present += block["days_present"];
      total_earning += block["total_earning"];
      total_deduction += block["total_deduction"];
      net_salary += block["net_salary"];
      paid_leaves += block["paid_leaves"];
      unpaid_leaves += block["unpaid_leaves"];
      total_leave_taken += block["total_leave_taken"];
      leave_balance += block["leave_balance"];
      final_leave_balance += block["final_leave_balance"];

      /*salary details calculation */
      block_salary_details = block["salary_detail"];

      bs_EPF += block_salary_details["EPF"];
      bs_Loan += block_salary_details["Loan"];
      bs_Advance += block_salary_details["Advance"];
      bs_Misc_Deductions += block_salary_details["Misc_Deductions"];
      bs_TDS += block_salary_details["TDS"];
      // bs_Increment_Amount += block_salary_details['Increment_Amount'];
      bs_Arrears += block_salary_details["Arrears"];
      bs_Basic += block_salary_details["Basic"];
      bs_HRA += block_salary_details["HRA"];
      bs_Conveyance += block_salary_details["Conveyance"];
      bs_Medical_Allowance += block_salary_details["Medical_Allowance"];
      bs_Special_Allowance += block_salary_details["Special_Allowance"];
      bs_total_holding_amount += block_salary_details["total_holding_amount"];
      bs_total_earning += block_salary_details["total_earning"];
      bs_total_deduction += block_salary_details["total_deduction"];
      bs_total_net_salary += block_salary_details["total_net_salary"];
      bs_misc_deduction2 += block_salary_details["misc_deduction2"];
      bs_bonus += block_salary_details["bonus"];
    }

    let final_salary_detals = {
      EPF: bs_EPF,
      Loan: bs_Loan,
      Advance: bs_Advance,
      Misc_Deductions: bs_Misc_Deductions,
      TDS: bs_TDS,
      // "Increment_Amount" :bs_Increment_Amount,
      Arrears: bs_Arrears,
      Basic: bs_Basic,
      HRA: bs_HRA,
      Conveyance: bs_Conveyance,
      Medical_Allowance: bs_Medical_Allowance,
      Special_Allowance: bs_Special_Allowance,
      total_holding_amount: bs_total_holding_amount,
      total_earning: bs_total_earning,
      total_deduction: bs_total_deduction,
      total_net_salary: bs_total_net_salary,
      misc_deduction2: bs_misc_deduction2,
      bonus: bs_bonus,
    };
    user_data_for_payslip["salary_detail"] = final_salary_detals;

    user_data_for_payslip["total_working_days"] = total_working_days;
    user_data_for_payslip["days_present"] = days_present;
    user_data_for_payslip["total_earning"] = total_earning;
    user_data_for_payslip["total_deduction"] = total_deduction;
    user_data_for_payslip["net_salary"] = net_salary;
    user_data_for_payslip["paid_leaves"] = round(paid_leaves, 2);
    user_data_for_payslip["unpaid_leaves"] = round(unpaid_leaves, 2);
    user_data_for_payslip["total_leave_taken"] = total_leave_taken;
    user_data_for_payslip["leave_balance"] = leave_balance;
    user_data_for_payslip["final_leave_balance"] = final_leave_balance;

    user_data_for_payslip["extra_arrear"] = 0;
    user_data_for_payslip["arrear_for_month"] = 0;

    final_extra_arrear = 0;
    final_arrear_for_month = 0;
    if (!_.isEmpty(extra_arrear) && !_.isEmpty(arrear_for_month)) {
      user_data_for_payslip["extra_arrear"] = extra_arrear;
      user_data_for_payslip["arrear_for_month"] = arrear_for_month;
      final_arrear = await checkArrearDetail(
        userid,
        year,
        month,
        extra_arrear,
        arrear_for_month,
        db
      );
      // user_data_for_payslip['salary_detail']['Arrears'] = $final_arrear;
    }

    user_data_for_payslip["salary_detail"]["misc_deduction2"] = misc_deduction;
    user_data_for_payslip["salary_detail"]["bonus"] = bonus;

    /* check if last month payslip is genereated or not */
    if (checkPreviousMonthPayslip) {
      checkEmployeeLastMonthPayslipData =
        await checkEmployeeLastMonthPayslipStatus(userid, year, month, db);
      if (checkEmployeeLastMonthPayslipData != false) {
        r_data["last_month_payslip_pending"] =
          checkEmployeeLastMonthPayslipData;
        net_salary_including_previous_month =
          user_data_for_payslip["net_salary"] * 1 +
          checkEmployeeLastMonthPayslipData["user_data_for_payslip"][
            "net_salary"
          ] *
            1;
        user_data_for_payslip["net_salary_including_previous_month"] =
          Math.round(net_salary_including_previous_month, 2);
      }
    }
    /* check if last month payslip is genereated or not */
    finalArray["employee_toshow_pending_leaves"] = emp_toshow_pending_leaves;
    finalArray["employee_toshow_days_before_joining"] =
      emp_toshow_days_before_joining;
    finalArray["employee_applied_pending_leaves"] = emp_applied_pending_leaves;

    finalArray["user_payslip_history"] = employeePreviousPayslips;

    finalArray["google_drive_emailid"] = "";
    if (
      Array.isArray(check_google_drive_connection) &&
      check_google_drive_connection.length > 0
    ) {
      //r_data['google_drive_emailid'] = check_google_drive_connection['email_id'];
      finalArray["google_drive_emailid"] = "Yes email id exist";
    }

    finalArray["employee_actual_salary"] = actual_salary_detail;
    finalArray["all_users_latest_payslip"] = await getAllUserPayslip(
      userid,
      year,
      month,
      db
    );
    finalArray["breakup"] = blocks;
    /* calculating final payslip array */

    // print_r($finalArray);

    r_error = 0;
    r_data = finalArray;
  } else {
    r_error = 1;
    r_message = "No salary details found for this employee";
  }
  let Return = {};
  Return["error"] = r_error;
  Return["data"] = r_data;
  Return["message"] = r_message;
  return Return;
};

let array_values = async (input) => {
  const tmpArr = [];
  let key = "";
  for (key in input) {
    tmpArr[tmpArr.length] = input[key];
  }
  return tmpArr;
};

let checkEmployeeLastMonthPayslipStatus = async (userid, year, month, db) => {
  let ret = false;
  let toCheckYear = year;
  let toCheckMonth = month - 1;
  if (month == 1) {
    toCheckMonth = 12;
    toCheckYear = year - 1;
  }
  let empInfo = await getEmployeeCompleteInformation(userid, req, db);
  let empDateOfJoining = empInfo["dateofjoining"];
  let dateToCheckPayslip = toCheckYear + "-" + toCheckMonth + "-01";
  let explodeDoj = empDateOfJoining.split("-");
  let dojYear = explodeDoj[0];
  let dojMonth = explodeDoj[1];
  let doj = dojYear + "-" + dojMonth + "-01";
  let isEligibleForLastMonthSalary = false;
  if (new Date(doj).getTime() <= new Date(dateToCheckPayslip).getTime()) {
    isEligibleForLastMonthSalary = true;
  }
  if (isEligibleForLastMonthSalary) {
    let empPreviousPayslips = await getUserPayslipInfo(userid, db);
    let lastMonthPayslipGenerated = false;
    for (let [key, ps] of Object.entries(empPreviousPayslips)) {
      if (
        ps["year"] * 1 == toCheckYear * 1 &&
        ps["month"] * 1 == toCheckMonth * 1
      ) {
        lastMonthPayslipGenerated = true;
      }
    }
    if (lastMonthPayslipGenerated == false) {
      let lastMonthPayslip = await getUserManagePayslip(
        userid,
        toCheckYear,
        toCheckMonth,
        0,
        0,
        false,
        db
      );
      lastMonthPayslip = lastMonthPayslip["data"];
      ret = lastMonthPayslip;
    }
  }
  return ret;
};

let getUserManagePayslip = async (
  userid,
  year,
  month,
  extra_arrear,
  arrear_for_month,
  checkPreviousMonthPayslip = true,
  db
) => {
  r_error = 1;
  let r_message = "";
  let r_data = {};
  let date = year + "-" + month + "-01";
  let month_name = date("F", strtotime(date));
  new Date(date).toLocaleString("default", { month: "long" });
  let user_salaryinfo = [];
  //get all salary list of employee
  let res1 = await getSalaryInfo(userid, db, "first_to_last", date);
  //get employee profile detail.
  let res0 = await getUserprofileDetail(userid, req, db);
  // get latest salary id
  let latest_sal_id = res1.length - 1;
  user_salaryinfo = res1[latest_sal_id];
  //get total working days of month
  user_salaryinfo["total_working_days"] = await getTotalWorkingDays(
    year,
    month,
    userid,
    db
  );
  //get employee month attendance
  let dayp = await getUserMonthPunching(userid, year, month, db);

  /* emp working dayss without punch time */
  let empWithoutPunchDaysData = await getEmployeeWorkingDaysWithoutPunchTime(
    userid,
    year,
    month,
    db
  );
  let employeeWorkingDaysWithoutPunchTime =
    empWithoutPunchDaysData["pending_leaves"];
  let emp_toshow_pending_leaves =
    empWithoutPunchDaysData["toshow_pending_leaves"];
  let emp_toshow_days_before_joining =
    empWithoutPunchDaysData["toshow_days_before_joining"];
  let emp_applied_pending_leaves =
    empWithoutPunchDaysData["applied_pending_leaves"];

  user_salaryinfo["days_present"] = dayp.length;
  //get employee month salary details
  let actual_salary_detail = (salary_detail = await getSalaryDetail(
    user_salaryinfo["id"],
    userid
  ));
  //get misc deduction of salary month form payslips table.
  let misc_deduction = await getUserMiscDeduction(userid, year, month, db);
  salary_detail["misc_deduction2"] = misc_deduction;
  //get bonus of salary month form payslips table.
  let bonus = await getUserBonus(userid, year, month, db);
  salary_detail["bonus"] = bonus;
  //per day calculate salary
  pday_basic = salary_detail["Basic"] / user_salaryinfo["total_working_days"];
  pday_hra = salary_detail["HRA"] / user_salaryinfo["total_working_days"];
  pday_conve =
    salary_detail["Conveyance"] / user_salaryinfo["total_working_days"];
  pday_med =
    salary_detail["Medical_Allowance"] / user_salaryinfo["total_working_days"];
  pday_spl =
    salary_detail["Special_Allowance"] / user_salaryinfo["total_working_days"];
  pday_arrear =
    salary_detail["Arrears"] / user_salaryinfo["total_working_days"];
  //calculate end
  user_salaryinfo["year"] = year;
  user_salaryinfo["month"] = month;
  user_salaryinfo["month_name"] = month_name;
  user_salaryinfo["name"] = res0["name"];
  user_salaryinfo["dateofjoining"] = res0["dateofjoining"];
  user_salaryinfo["jobtitle"] = res0["jobtitle"];
  // get employee actual salary total earning and total deduction.
  actual_salary_detail["total_earning"] =
    actual_salary_detail["Basic"] +
    actual_salary_detail["HRA"] +
    actual_salary_detail["Conveyance"] +
    actual_salary_detail["Medical_Allowance"] +
    actual_salary_detail["Special_Allowance"] +
    actual_salary_detail["Arrears"];
  actual_salary_detail["total_deduction"] =
    salary_detail["EPF"] +
    actual_salary_detail["Loan"] +
    actual_salary_detail["Advance"] +
    actual_salary_detail["Misc_Deductions"] +
    actual_salary_detail["TDS"];
  //employee actual net salary
  actual_salary_detail["net_salary"] =
    actual_salary_detail["total_earning"] -
    actual_salary_detail["total_deduction"];
  // get employee month payslip info
  res = await getUserPayslipInfo(userid, db);
  // echo '<pre>';
  // print_r(res );

  // changes done on 7ht june 2018 by arun
  // this was the calulcation to have the leave balance and every time it was returning the latest leave balance
  // even if we were viewing many months back payslip
  // to fix this we need to we need to process on the basis of month opted

  if (res.length > 0) {
    // 7 June 2018 : first check if we are calculating for previous month of current month
    // if above condition is true then old logic else new logic will be implemented to call the balance leave
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1;

    let current_month_previous_month_year = await _getPreviousMonth(
      currentYear,
      currentMonth
    );
    let current_month_previous_year = current_month_previous_month_year["year"];
    let current_month_previous_month =
      current_month_previous_month_year["month"];

    if (
      current_month_previous_year == year &&
      current_month_previous_month == month
    ) {
      // start old logic
      if (res[0]["month"] == month) {
        if (res[1]["final_leave_balance"] == "") {
          balance_leave = 0;
        } else {
          balance_leave = res[1]["final_leave_balance"];
        }
      } else {
        if (res[0]["final_leave_balance"] == "") {
          balance_leave = 0;
        } else {
          balance_leave = $res[0]["final_leave_balance"];
        }
      }
      // end old logic
    } else {
      // start new logic
      previousMonthDetails = await _getPreviousMonth(year, month);
      balance_leave_check_of_month = previousMonthDetails["month"];
      balance_leave_check_of_year = previousMonthDetails["year"];

      balance_leave = 0;

      for (let ps of res) {
        if (
          ps["year"] == balance_leave_check_of_year &&
          ps["month"] == balance_leave_check_of_month
        ) {
          if (ps["final_leave_balance"] != "") {
            balance_leave = ps["final_leave_balance"];
            break;
          }
        }
      } // end new logic
    }
  }

  // echo "$balance_leave -- <br>";

  // if no data of employee in payslips table
  if (res.length <= 0) {
    //get employee detail from payslip table of previous  hr system
    let prev = await getUserBalanceLaveInfo(userid, year, month, db);
    balance_leave = prev["final_leave_balance"];
  }
  //get employee month leave info
  let c = await getUserMonthLeaves(userid, year, month, db);

  let current_month_leave = 0;
  // get employee total no. of leave taken in month
  if (c.length > 0) {
    for (let v of c) {
      let vStatus = v["status"].toLowerCase();
      if (vStatus == "approved" || vStatus == "pending") {
        if (
          vStatus == "approved" &&
          v["leave_type"] != "undefined" &&
          v["leave_type"].toLowerCase() == "rh compensation"
        ) {
        } else {
          if (v["no_of_days"] < 1) {
            current_month_leave = current_month_leave + v["no_of_days"];
            user_salaryinfo["days_present"] =
              user_salaryinfo["days_present"] - v["no_of_days"];
          } else {
            current_month_leave = current_month_leave + 1;
          }
        }
      }
    }
  }

  // get final leave balance of employee
  let leaves =
    balance_leave - current_month_leave + user_salaryinfo["leaves_allocated"];
  if (leaves >= 0) {
    paid_leave = current_month_leave;
    unpaid_leave = 0;
  }
  if (leaves < 0) {
    paid_leave = current_month_leave - Math.abs(leaves);
    unpaid_leave = Math.abs(leaves);
  }

  /* added by arun on 18th cotober 2019 to consider not appllied leaves as unpaid leave for salary calculation*/
  if (employeeWorkingDaysWithoutPunchTime.length > 0) {
    unpaid_leave += employeeWorkingDaysWithoutPunchTime.length;
  }
  /* added by arun on 18th cotober 2019 to consider not appllied leaves as unpaid leave for salary calculation*/

  //final salary calculate
  final_basic = salary_detail["Basic"] - pday_basic * unpaid_leave;
  final_hra = salary_detail["HRA"] - pday_hra * unpaid_leave;
  final_conve = salary_detail["Conveyance"] - pday_conve * unpaid_leave;
  final_med = salary_detail["Medical_Allowance"] - pday_med * unpaid_leave;
  final_spl = salary_detail["Special_Allowance"] - pday_spl * unpaid_leave;
  final_arrear = salary_detail["Arrears"] - pday_arrear * unpaid_leave;
  //end final salary calculation
  // calculate arrear of previous month
  user_salaryinfo["extra_arrear"] = 0;
  user_salaryinfo["arrear_for_month"] = 0;
  if (!_.isEmpty(extra_arrear) && !_.isEmpty(arrear_for_month)) {
    user_salaryinfo["extra_arrear"] = extra_arrear;
    user_salaryinfo["arrear_for_month"] = arrear_for_month;
    final_arrear = await checkArrearDetail(
      userid,
      year,
      month,
      extra_arrear,
      arrear_for_month,
      db
    );
  }

  //array formation with values to display on hr system.
  salary_detail["Basic"] = final_basic * 1 > 0 ? Math.round(final_basic, 2) : 0;
  salary_detail["HRA"] = final_hra * 1 > 0 ? Math.round(final_hra, 2) : 0;
  salary_detail["Conveyance"] =
    final_conve * 1 > 0 ? Math.round(final_conve, 2) : 0;
  salary_detail["Medical_Allowance"] =
    final_med * 1 > 0 ? Math.round(final_med, 2) : 0;
  salary_detail["Special_Allowance"] =
    final_spl * 1 > 0 ? Math.round(final_spl, 2) : 0;
  salary_detail["Arrears"] =
    final_arrear * 1 > 0 ? Math.round(final_arrear, 2) : 0;
  user_salaryinfo["salary_detail"] = salary_detail;
  total_earning =
    salary_detail["Basic"] +
    salary_detail["HRA"] +
    salary_detail["Conveyance"] +
    salary_detail["Medical_Allowance"] +
    salary_detail["Special_Allowance"] +
    salary_detail["Arrears"] +
    salary_detail["bonus"];
  total_deduction =
    salary_detail["EPF"] +
    salary_detail["Loan"] +
    salary_detail["Advance"] +
    salary_detail["Misc_Deductions"] +
    salary_detail["TDS"] +
    salary_detail["misc_deduction2"];
  net_salary = total_earning - total_deduction;
  user_salaryinfo["total_earning"] = Math.round(total_earning, 2);
  user_salaryinfo["total_deduction"] = Math.round(total_deduction, 2);
  user_salaryinfo["net_salary"] = Math.round(net_salary, 2);
  // user_salaryinfo['days_present'] = user_salaryinfo['total_working_days'] - current_month_leave;
  user_salaryinfo["paid_leaves"] = paid_leave;
  user_salaryinfo["unpaid_leaves"] = unpaid_leave;
  user_salaryinfo["total_leave_taken"] = current_month_leave;
  user_salaryinfo["leave_balance"] = balance_leave;
  final_leave_balance =
    balance_leave +
    res1[latest_sal_id]["leaves_allocated"] -
    current_month_leave;
  if (final_leave_balance <= 0) {
    user_salaryinfo["final_leave_balance"] = 0;
  }
  if (final_leave_balance > 0) {
    user_salaryinfo["final_leave_balance"] =
      balance_leave +
      res1[latest_sal_id]["leaves_allocated"] -
      current_month_leave;
  }
  check_google_drive_connection = await getGoogleDriveToken();
  r_error = 0;

  /* check if last month payslip is genereated or not */
  if (checkPreviousMonthPayslip) {
    checkEmployeeLastMonthPayslipData =
      await checkEmployeeLastMonthPayslipStatus(userid, year, month, db);
    if (checkEmployeeLastMonthPayslipData != false) {
      r_data["last_month_payslip_pending"] = checkEmployeeLastMonthPayslipData;
      net_salary_including_previous_month =
        user_salaryinfo["net_salary"] * 1 +
        checkEmployeeLastMonthPayslipData["user_data_for_payslip"][
          "net_salary"
        ] *
          1;
      user_salaryinfo["net_salary_including_previous_month"] = Math.round(
        net_salary_including_previous_month,
        2
      );
    }
  }
  /* check if last month payslip is genereated or not */

  /* new key value added to show amount deducted against leaves taken */
  let total_leaves_amount_deducted = 0;
  if (
    (user_salaryinfo["total_salary"] && user_salaryinfo["total_earning"]) !=
    "undefined"
  ) {
    total_leaves_amount_deducted =
      user_salaryinfo["total_salary"] * 1 -
      user_salaryinfo["total_earning"] * 1;
  }
  user_salaryinfo["total_leaves_amount_deducted"] = Math.round(
    total_leaves_amount_deducted,
    2
  );

  r_data["user_data_for_payslip"] = user_salaryinfo;

  r_data["employee_pending_leave"] = employeeWorkingDaysWithoutPunchTime;
  r_data["employee_toshow_pending_leaves"] = emp_toshow_pending_leaves;
  r_data["employee_toshow_days_before_joining"] =
    emp_toshow_days_before_joining;
  r_data["employee_applied_pending_leaves"] = emp_applied_pending_leaves;

  r_data["user_payslip_history"] = res;
  r_data["google_drive_emailid"] = "";
  r_data["employee_actual_salary"] = actual_salary_detail;
  if (
    Array.isArray(check_google_drive_connection) &&
    check_google_drive_connection.length > 0
  ) {
    //r_data['google_drive_emailid'] = check_google_drive_connection['email_id'];
    r_data["google_drive_emailid"] = "Yes email id exist";
  }
  //get employee all previous payslip.
  r_data["all_users_latest_payslip"] = await getAllUserPayslip(
    userid,
    year,
    month,
    db
  );

  let Return = {};
  Return["error"] = r_error;
  Return["data"] = r_data;
  return Return;
};
let createUserPayslip = async (req, db) => {
    let r_error = 1;
    let r_message = "";
    let r_exception = "";
    let r_data = {};
    let date = req.body['year'] + "-" + req.body['month'] + "-01";
    let month_name = new Date(date).toLocaleString('default', { month: 'long' })
    let ins = {
        user_Id: req.body['user_id'],
        month: req.body['month'],
        year: req.body['year'],
        total_leave_taken: req.body['total_leave_taken'],
        leave_balance: req.body['leave_balance'],
        allocated_leaves: req.body['allocated_leaves'],
        paid_leaves: req.body['paid_leaves'],
        unpaid_leaves: req.body['unpaid_leaves'],
        final_leave_balance: req.body['final_leave_balance'],
        misc_deduction_2: req.body['misc_deduction_2'],
        bonus: req.body['bonus'],
        payslip_url: 0,

        total_working_days: req.body['total_working_days'],
        total_earnings: req.body['total_earning'],
        total_deductions: req.body['total_deduction'],
        total_taxes: req.body['tds'],
        total_net_salary: req.body['net_salary'],
        payslip_file_id: 0// this is added for default value
    }
    // let check_google_drive_connection = await getGoogleDriveToken();
    let check_google_drive_connection = [];
    if (!Array.isArray(check_google_drive_connection) && (check_google_drive_connection.length) > 0) {
        r_error = 1;
        r_message = "Refresh token not found. Connect do google login first";
        r_data['message'] = r_message;
    }
    else {
        google_drive_file_url = [];
        file_id = false;
        url = "";
        // g_token = check_google_drive_connection['value'];
        parent_folder = "Employees Salary Payslips";
        upload_path = '../uploads/payslips';
        userid = req.body['user_id'];
        userInfo = await getUserInfo(userid, db);
        userInfo_name = userInfo['name'];
        // html = '';
        // html = ob_start();
        let q = await db.sequelize.query(`SELECT * FROM payslips where user_Id ='${req.body['user_id']}' AND month ='${req.body['month']}' AND year ='${req.body['year']}'`, { type: QueryTypes.SELECT });
        if (q.length > 0) {
            q = await db.sequelize.query(`DELETE FROM payslips where user_Id ='${req.body['user_id']}' AND month ='${req.body['month']}' AND year ='${req.body['year']}'`, { type: QueryTypes.DELETE });
        }
        // console.log(ins.user_Id)
        res = await db.sequelize.query(`INSERT INTO payslips 
        (user_Id,month,year,total_leave_taken,leave_balance,allocated_leaves,paid_leaves,unpaid_leaves,final_leave_balance,payslip_url,payslip_file_id,misc_deduction_2,bonus,total_working_days,total_earnings,total_deductions,total_taxes,total_net_salary) 
        Values
        ( '${ins.user_Id}',${ins.month},${ins.year},${ins.total_leave_taken},${ins.leave_balance},${ins.allocated_leaves},${ins.paid_leaves},${ins.unpaid_leaves},${ins.final_leave_balance},${ins.payslip_url},${ins.payslip_file_id},${ins.misc_deduction_2},${ins.bonus},${ins.total_working_days},${ins.total_earnings},${ins.total_deductions},${ins.total_taxes},${ins.total_net_salary})`, { type: QueryTypes.INSERT });

        if (res.length = 0) {
            r_error = 1;
            r_message = "Error occured while inserting data";
            r_data['message'] = r_message;
        } else {
            let payslip_no = res[0];
            let payslip_name = month_name;
            let payslip_unique_name = userid + '_' + payslip_name + '_' + req['year'];
            //create pdf of payslip template
            //    suc = await createPDf(html,payslip_unique_name,path =upload_path);

            // try {
            //     // upload created payslip pdf file in google drive
            //     // $payslip_name = $payslip_name.".pdf";
            //     $payslip_name = $payslip_unique_name.".pdf";
            //     $file_directory = $upload_path . "/" . $payslip_name;
            //     $subfolder_year = date("Y") . "-" . $userid;
            //     $google_drive_file_url = Document::saveFileToGoogleDrive( $g_token, $parent_folder, $file_directory, $userInfo_name, $subfolder_year);

            // } catch( Exception $ex ) {
            //     $error = json_decode($ex->getMessage(), true);
            //     if( $error ){
            //         $r_exception = $error['error']['message'];
            //     } else {
            //         $r_exception = $ex->getMessage();
            //     }
            // }

            // // if google drive upload fails
            // if (sizeof($google_drive_file_url) <= 0) {
            //     $url = $_ENV['ENV_BASE_URL'] . 'attendance/uploads/payslips/' . $payslip_unique_name . '.pdf';
            // } else {
            //     $url = $google_drive_file_url['url'];
            //     $file_id = $google_drive_file_url['file_id'];
            // }

            // $query = "UPDATE payslips SET payslip_url= '" . mysqli_real_escape_string($mysqli, $url) . "' , payslip_file_id = '" . $file_id . "' WHERE id = $payslip_no";
            // self::DBrunQuery($query);
            // // if send mail option is true
            // if ($data['send_email'] == 1 || $data['send_email'] == '1') {
            //     // send slack notification message 
            //     self::sendPayslipMsgEmployee($payslip_no);
            // }

            // if ($data['send_slack_msg'] == 1 || $data['send_slack_msg'] == '1') {
            //     // send slack notification message 
            //     self::sendPayslipMsgEmployee($payslip_no, $data);
            // }

            r_error = 0;
            r_message = "Salary slip generated successfully";
            r_data['message'] = r_message;
            r_data['exception'] = [];
            // r_data['exception'] = r_exception;
        }
    }
    let Return ={};
       Return['error'] =r_error;
       Return['data'] =r_data;
        return Return;
};
let getAllUserInfo=async(teamName = false,hideSecureInfo = false,req,db)=>{
  let start_increment_date;
    let r_error = 1;
    let r_message = "";
    let r_data = {};
    let a;
    if (teamName ==false) {
        a = await getAllUserDetail(data=false,req,db);
    }
    if (teamName != "") {
        a = await getAllUserDetail(teamName);
    }
    let row2 = [];
    // let allSlackUsers = await getSlackUsersList();
    for (let val of a ) {
        let userid = val['user_Id'];
        let emailid =val['work_email'];
        console.log(121212)
        let sal = await getUserlatestSalary(767,false,db);
        console.log(sal)
        let salary_detail = 0;
        let previous_increment = 0;
        let next_increment_date = "";
        let slack_image = "";
        let holding = 0;

        if((sal.length) > 0 ){
            let latest_sal_id = sal[0]['id'];
            let row =await db.sequelize.query(`SELECT * FROM salary_details WHERE salary_id= ${latest_sal_id} AND 'key' = 'Misc_Deductions'`,{type:QueryTypes.SELECT});
            // $runQuery = self::DBrunQuery($q);
            // $row = self::DBfetchRow($runQuery);
            // $row['value'];
         
            if (sal.length >= 2) {
                previous_increment = Math.abs(sal[0]['total_salary'] - sal[1]['total_salary']);
                salary_detail = sal[0]['total_salary'] + row['value'];
                next_increment_date = sal[0]['applicable_till'];
                start_increment_date = sal[0]['applicable_from'];
            }
            if ((sal.length) >= 1 && (sal.length) < 2) {
                salary_detail = sal[0]['total_salary'] + row['value'];
                next_increment_date = sal[0]['applicable_till'];
                start_increment_date = sal[0]['applicable_from'];
            }
        }
        
        let now = new Date(); // or your date as well
        let your_date = val['dateofjoining'];
        let date1 = new Date(your_date);
        let date2 = new Date(now);
        let interval = intervalToDuration({
            start: new Date(date1),
            end: new Date(date2)
          })

        // for (let s of allSlackUsers ) {
        //     if (s['profile']['email'] == emailid) {
        //         sl = s;
        //         break;
        //     }
        // }

        // $sl = self::getSlackUserInfo($emailid);
        // if ((sl.length) > 0) {
        //     val['slack_profile'] = sl; 
        //     // slack_image = await _getEmployeeProfilePhoto($val);
        //     slack_id = sl['id'];
        // }
        let h = await getHoldingDetail(userid,db);
        if ((h.length) > 0) {
            holding = (h.length-1);
        }
       val['slack_image'] =slack_image;
      //  val['user_slack_id'] =slack_id;
       val['salary_detail'] =salary_detail;
       val['previous_increment'] =previous_increment;
       val['next_increment_date'] =next_increment_date;
       val['start_increment_date'] =start_increment_date;
       val['no_of_days_join'] =interval.years + " years, " +interval.months + " months, " +interval.days + " days ";
       val['holdin_amt_detail'] =holding;

        if( hideSecureInfo ){
            val['salary_detail'] = "No Access";
            val['holdin_amt_detail'] = "No Access";
            val['previous_increment'] = "No Access";
            val['password'] = "No Access";
            val['next_increment_date'] = "No Access";
            val['holding_comments'] = "No Access";
        }


        row2.push(val);
    }
    let Return = {};
    r_error = 0;
    Return['error'] = r_error;
    Return['data'] = row2;
    console.log(Return,1211212)
    return Return;

}

let getAllUserPayslip = async (userid, year, month, db) => {
  let row = await db.sequelize.query(
    `select * from payslips where month='${month}' AND year = '${year}'`,
    { type: QueryTypes.SELECT }
  );
  return row;
};
let getSalaryDetail = async (salary_id, userid = false, db) => {
  let ret = [];
  let row = await db.sequelize.query(
    `select * from salary_details where salary_id = '${salary_id}'`,
    { type: QueryTypes.SELECT }
  );
  for (let val of row) {
    ret[val["key"]] = val["value"];
  }
  let holidingAmount = 0;
  if (userid != false) {
    let holdingDetails = await getHoldingDetail(userid, db);
    if (Array.isArray(holdingDetails) && holdingDetails.length > 0) {
      let holdingInfo = holdingDetails[holdingDetails - 1];
      if (
        holdingInfo["holding_amt"] != "undefined" &&
        holdingInfo["holding_amt"] * 1 > 0
      ) {
        holidingAmount = holdingInfo["holding_amt"] * 1;
      }
    }
  }
  /* added by arun on 9th oct 2019 for holiding amount to be calculate in API*/

  /* added by arun on 26th august 2019 for salary caluclation */
  sum_earnings =
    ret["Basic"] +
    ret["HRA"] +
    ret["Conveyance"] +
    ret["Medical_Allowance"] +
    ret["Special_Allowance"];
  sum_deductions = ret["Misc_Deductions"] + ret["TDS"] + holidingAmount;
  net_salary = sum_earnings - sum_deductions;

  ret["total_holding_amount"] = Math.round(holidingAmount, 2);
  ret["total_earning"] = Math.round(sum_earnings, 2);
  ret["total_deduction"] = Math.round(sum_deductions, 2);
  ret["total_net_salary"] = Math.round(net_salary, 2);
  /* added by arun on 26th august 2019 for salary caluclation */
  return ret;
};
let checkArrearDetail = async (
  userid,
  year,
  month,
  extra_arrear,
  arrear_for_month,
  db
) => {
  let prev_month = month;
  let prev_year = year;

  let prev_arr = [];

  for (i = 1; i <= arrear_for_month; i++) {
    let arr = [];
    prev_month = prev_month - 1;
    if (prev_month <= 0) {
      prev_year = year - 1;
      prev_month = 12;
    }

    let mon = await getTotalWorkingDays(prev_year, prev_month, userid, db);
    let c1 = await getUserMonthLeaves(userid, prev_year, prev_month, db);

    let c1_month_leave = 0;
    // get employee total no. of leave taken in month
    if (c1.length > 0) {
      for (let v of c1) {
        if (
          v["status"] == "Approved" ||
          v["status"] == "approved" ||
          v["status"] == "Pending" ||
          v["status"] == "pending"
        ) {
          if (v["no_of_days"] < 1) {
            c1_month_leave = c1_month_leave + v["no_of_days"];
          } else {
            c1_month_leave = c1_month_leave + 1;
          }
        }
      }
    }

    let paySlipInfo = await getUserPayslipInfo(userid, db);
    if (paySlipInfo.length > 0) {
      for (let ps of paySlipInfo) {
        if (ps["year"] == prev_year && ps["month"] == prev_month) {
          if (ps["final_leave_balance"] != "") {
            balance_leave = ps["final_leave_balance"];
            break;
          }
        }
      }
    }

    if (paySlipInfo.length <= 0) {
      //get employee detail from payslip table of previous  hr system
      prev = await getUserBalanceLaveInfo(userid, prev_year, prev_month, db);
      balance_leave = prev["final_leave_balance"];
    }

    date = prev_year + "-" + prev_month + "-01";
    let salInfo = await getSalaryInfo(userid, db, "first_to_last", date);
    // get latest salary id
    let latest_sal_id = salInfo.length - 1;
    user_salaryinfo = salInfo[latest_sal_id];

    // get final leave balance of employee
    leaves =
      balance_leave - c1_month_leave + user_salaryinfo["leaves_allocated"];
    if (leaves >= 0) {
      unpaid_leave = 0;
    }
    if (leaves < 0) {
      unpaid_leave = Math.abs(leaves);
    }
    arr["year"] = prev_year;
    arr["month"] = prev_month;
    arr["total_working_days"] = mon;
    arr["leave"] = c1_month_leave;
    arr["arrear_amount"] = extra_arrear - (extra_arrear / mon) * unpaid_leave;
    prev_arr.push(arr);
  }

  let arrear = 0;

  for (let fin of prev_arr) {
    arrear = arrear + fin["arrear_amount"];
  }

  return arrear;
};

let getUserBalanceLaveInfo = async (userid, year, month, db) => {
  let current_month = year + "-" + month;
  let date1 = new Date(current_month).getMonth();
  date1 = new Date(date1).setMonth(date1);
  let year1 = new Date(date1).getFullYear();
  let month1 = new Date(date1).getMonth();
  let prev_month = year1 + "-" + month1;
  let q = await db.sequelize.query(
    `select * from payslip where user_Id = '${userid}' ORDER by id DESC`,
    { type: QueryTypes.SELECT }
  );
  let r = {};
  for (let val of row) {
    if (val["payslip_month"].indexof("prev_month") !== false) {
      r = val;
    }
  }
  return r;
};
let getUserPayslipInfo = async (userid, db, hidePayslip = false) => {
  let row = await db.sequelize.query(
    `select * from payslips where user_Id = '${userid}' ORDER by id DESC`,
    { type: QueryTypes.SELECT }
  );
  if (hidePayslip == true) {
    if ((row.length) > 0) {
      for (let [key, value] of Object.entries(row)) {
        if (value["payslip_url"]) {
          delete row[key]["payslip_url"];
        }
        if (value["payslip_file_id"]) {
          delete row[key]["payslip_file_id"];
        }
      }
    }
  }

  return row;
};

let getUserMiscDeduction = async (userid, year, month, db) => {
  let result = 0;
  let q = await db.sequelize.query(
    `SELECT * FROM payslips WHERE user_Id= '${userid}'  AND month = '${month}' AND year= '${year}'`,
    { type: QueryTypes.SELECT }
  );
  if (q.length > 0) {
    result = q[0]["misc_deduction_2"];
  }
  return result;
};
let getEmployeeWorkingDaysWithoutPunchTime = async (
  userid,
  year,
  month,
  db,
  req,
  arrear_for_month
) => {
  let return_pending_leaves = {};
  let return_toshow_pending_leaves = {};
  let return_toshow_days_before_joining = {};
  let return_applied_pending_leaves = {};

  let empInfo = await getEmployeeCompleteInformation(userid, req, db);
  let emp_dateofjoining = empInfo["dateofjoining"];

  res = await getUserMonthAttendaceComplete(userid, year, month, db);
  if (
    res["data"] &&
    res["data"]["attendance"] &&
    res["data"]["attendance"].length > 0
  ) {
    let attendance = res["data"]["attendance"];
    for (let [key, day] of Object.entries(attendance)) {
      if (day["day_type"] == "WORKING_DAY") {
        let dayDate = day["full_date"];
        let dayInTime = day["in_time"];
        let dayOutTime = day["out_time"];
        if (dayInTime == "" && dayOutTime == "") {
          return_pending_leaves.push(dayDate);
          /* check if date is greater then equal to joining data of empployee*/
          if (
            new Date(dayDate).getTime() >= new Date(emp_dateofjoining).getTime()
          ) {
            return_toshow_pending_leaves.push(dayDate);
          } else {
            return_toshow_days_before_joining.push(dayDate);
          }
        }
      } else if (
        day["leave_status"] &&
        day["leave_status"].toLowerCase() == "pending"
      ) {
        dayDate = day["full_date"];
        return_pending_leaves.push(dayDate);
        if (
          new Date(dayDate).getTime() >= new Date(emp_dateofjoining).getTime()
        ) {
          return_applied_pending_leaves.push(dayDate);
        }
      }
    }
  }
  let Return = {
    pending_leaves: return_pending_leaves,
    toshow_pending_leaves: return_toshow_pending_leaves,
    toshow_days_before_joining: return_toshow_days_before_joining,
    applied_pending_leaves: return_applied_pending_leaves,
  };
  return Return;
};
let getUserBonus = async (userid, year, month, db) => {
  let result = 0;
  let q = await db.sequelize.query(
    `SELECT * FROM payslips WHERE user_Id= '${userid}'  AND month = '${month}' AND year= '${year}'`,
    { type: QueryTypes.SELECT }
  );
  if (q.length > 0) {
    result = q[0]["bonus"];
  }
  return result;
};
let getTotalWorkingDays = async (year, month, userid, db) => {
  let total_no_of_workdays = 0;

  let genericMonthDays = await getGenericMonthSummary(year, month, userid, db);
  for (let [key, day] of Object.entries(genericMonthDays)) {
    if (day["day_type"] == "WORKING_DAY") {
      total_no_of_workdays++;
    }
  }
  return total_no_of_workdays;
};

let getUserDetail = async (userid, db) => {
  try {
    let q = await db.sequelize.query(
      `SELECT users.*,user_profile.* FROM users LEFT JOIN user_profile ON users.id = user_profile.user_Id where users.status = 'Enabled' AND users.id = ${userid}`,
      { type: QueryTypes.SELECT }
    );
    let arr;
    for await (let val of q) {
      arr = {
        id: val.user_Id,
        name: val.name,
        email: val.email,
        date_of_joining: val.dateofjoining,
        type: val.type.toLowerCase(),
      };
    }
    return arr;
  } catch (error) {
    throw new Error(error);
  }
};

let getHoldingDetail = async (userid, db) => {
  try {
    let ret = [];
    let q = await db.sequelize.query(
      `select * from user_holding_info where user_Id = ${userid}`,
      { type: QueryTypes.SELECT }
    );
    let applicable_month = 0;
    let holding_start_date;
    for await (let [key, r] of Object.entries(q)) {
      let holding_month;
      if (
        r.holding_start_date != "undefined" &&
        r.holding_start_date != "" &&
        r.holding_start_date != "0000-00-00"
      ) {
        holding_start_date = r.holding_start_date;
      }
      if (
        r.holding_end_date != "undefined" &&
        r.holding_end_date != "" &&
        r.holding_end_date != "0000-00-00"
      ) {
        holding_end_date = r.holding_end_date;
      }
      if (
        holding_start_date != "undefined" &&
        holding_end_date != "undefined"
      ) {
        let begin = new Date(holding_start_date);
        let end = new Date(holding_end_date);
        // let interval = begin.setMonth(begin.getMonth() + 1);
        // console.log(begin,interval,end,11212)
        let period= getDates(new Date(begin), (new Date(end)).addMonth(1));
        // let period = createPeriod({ begin, interval, end });
        // console.log(21)
        holding_month = period.length;
      }
      q[key].holding_month = holding_month;
      holding_month = 0;
    }
    ret = q;
    return ret;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};
Date.prototype.addMonth = function(days) {
  var dat = new Date(this.valueOf())
  dat.setMonth(dat.getMonth() + days);
  return dat;
}
function getDates(startDate, stopDate) {
 var dateArray = new Array();
 var currentDate = startDate;
 while (currentDate <= stopDate) {
   dateArray.push(currentDate)
   currentDate = currentDate.addMonth(1);
 }
 return dateArray;
}
// var dateArray = getDates(new Date("2000-01-11"), (new Date()).addMonth(1));

let API_updateEmployeeAllocatedLeaves = async (reqBody, db) => {
  try {
    let error = 1;
    let message = "";
    if (reqBody.user_id == "undefined") {
      message = "User id is not set";
    } else {
      let userid = reqBody.user_id;
      let newAllocatedLeaves = reqBody.new_allocated_leaves;
      let existingSalaries = await getSalaryInfo(userid, db, "first_to_last");
      if (isArray(existingSalaries) && existingSalaries.length > 0) {
        let latestSalary = existingSalaries[existingSalaries.length - 1];
        let latestSalaryId = latestSalary.id;
        let q = await db.sequelize.query(
          `UPDATE salary set leaves_allocated = ${newAllocatedLeaves} WHERE id=${latestSalaryId}`,
          { type: QueryTypes.UPDATE }
        );
        if (q[1] == 1) {
          error = 0;
          message = "New allocated leaves update for employee";
        } else {
          error1;
          message = "failed to update allocate leaves";
        }
      } else {
        message =
          "No salary found for this employee. You need to add salary first";
      }
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

let API_updateEmployeeFinalLeaveBalance = async (reqBody, db) => {
  try {
    let error = 1;
    let message = "";
    if (reqBody.user_id == "undefined") {
      message = "User id is not set";
    } else if (reqBody.new_final_leave_balance == "undefined") {
      message = "New final leave balance is not set";
    } else {
      let userid = reqBody.user_id;
      let newFinalLeaveBalance = reqBody.new_final_leave_balance;
      let existingPayslips = await getUserPayslipInfo(userid, db);
      if (isArray(existingPayslips) && existingPayslips.length > 0) {
        let latestPayslip = existingPayslips[0];
        let latestPayslipId = latestPayslip.id;
        let q = await db.sequelize.query(
          `UPDATE payslips set final_leave_balance = ${newFinalLeaveBalance} WHERE id=${latestPayslipId}`,
          { type: QueryTypes.UPDATE }
        );
        if (q[1] == 1) {
          error = 0;
          message = "New final leave balance updated for employee";
        } else {
          message = "Failed to update new final leave balance";
        }
      } else {
        message =
          "No payslip found for this employee. You can't update his final leave balance.";
      }
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

const getTeamSalaryDetails = async (teams) => {
  let whereCond = ''
  teams.forEach(team=>{
    if(whereCond === ''){
      whereCond = `team like "%${team}%"`;
    }else{
      whereCond += ` or team like "%${team}%"`;
    }
  })
  const data = await db.sequelize.query(`SELECT * FROM excellen_hr_test.user_profile
  INNER JOIN excellen_hr_test.salary ON excellen_hr_test.user_profile.user_id = excellen_hr_test.salary.user_id
  WHERE ${whereCond}`);
  if (!data.length) {
    return [];
  }
  for (let user of data[0]) {
    user.salary_info = {
      total_salary: user.total_salary,
      last_updated_on: user.last_updated_on,
      updated_by: user.updated_by,
      leaves_allocated: user.leaves_allocated,
      applicable_from: user.applicable_from,
      applicable_till: user.applicable_till,
    }

    delete user.total_salary
    delete user.last_updated_on
    delete user.updated_by
    delete user.leaves_allocated
    delete user.applicable_from
    delete user.applicable_till
  }
  return data[0];
}
const getTeamPermissions = async () => {
  const data = await db.sequelize.query(`SELECT value FROM config WHERE type = 'team_permissions';`)
  if (!data.length) {
    return [];
  }
  return JSON.parse(data[0][0].value);
}
const getTeamSalaryDetailsByRoles = async (roles) => {
  let rolesStr = ''
  roles.forEach(role=>{
    if(rolesStr === ''){
      rolesStr = `"${role}"`;
    }else{
      rolesStr += `, "${role}"`;
    }
  })
  const data = await db.sequelize.query(`SELECT * FROM excellen_hr_test.user_profile
  INNER JOIN excellen_hr_test.salary ON excellen_hr_test.user_profile.user_id = excellen_hr_test.salary.user_id
  WHERE excellen_hr_test.user_profile.user_id in (SELECT distinct user_id from excellen_hr_test.user_roles
WHERE role_id in (SELECT id as ids FROM excellen_hr_test.roles
where description in (${rolesStr})));`);
  if (!data.length) {
    return [];
  }
  for (let user of data[0]) {
    user.salary_info = {
      total_salary: user.total_salary,
      last_updated_on: user.last_updated_on,
      updated_by: user.updated_by,
      leaves_allocated: user.leaves_allocated,
      applicable_from: user.applicable_from,
      applicable_till: user.applicable_till,
    }

    delete user.total_salary
    delete user.last_updated_on
    delete user.updated_by
    delete user.leaves_allocated
    delete user.applicable_from
    delete user.applicable_till
  }
  return data[0];
}

module.exports = {
  deleteUserSalary,
  getUserManagePayslipBlockWise,
  createUserPayslip,
  getAllUserInfo,
  API_updateEmployeeFinalLeaveBalance,
  API_updateEmployeeAllocatedLeaves,
  getUserPayslipInfo,
  deleteUserSalary,
  getUserManagePayslipBlockWise,
  getUserDetail,
  getHoldingDetail,
  getSalaryDetail,
  getTeamSalaryDetails,
  getTeamPermissions,
  getTeamSalaryDetailsByRoles,
};

