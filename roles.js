let PAGE_home = 101;
let PAGE_monthly_attendance = 102;
let PAGE_inventory_system = 103;
let PAGE_manage_payslips = 104;
let PAGE_manage_working_hours = 105;
let PAGE_holidays = 107;
let PAGE_team_view = 108;
let PAGE_apply_leave = 109;
let PAGE_manage_leaves = 110;
let PAGE_my_leaves = 111;
let PAGE_disabled_employees = 112;
let PAGE_manage_user_working_hours = 113;
let PAGE_leaves_summary = 114;
let PAGE_salary = 115;
let PAGE_manage_salary = 116;
let PAGE_my_profile = 117;
let PAGE_my_inventory = 118;
let PAGE_manage_users = 119;
let PAGE_manage_clients = 120;
let PAGE_forgot_password = 121;
let PAGE_documents = 122;
let PAGE_uploadAttendance = 123;
let PAGE_view_salary = 124;
let PAGE_policy_documents = 125;
let PAGE_upload_policy_documents = 126;
// let PAGE_add_variables = 127; page is no more needed
let PAGE_mail_templates = 128;
let PAGE_login = 129;
let PAGE_manage_roles = 130;
let PAGE_manage_user_pending_hours = 131;
let PAGE_logout = 132;
let PAGE_add_documents = 133;
let PAGE_health_stats = 134;
let PAGE_settings = 135;
let PAGE_all_employee = 136;
let PAGE_rh_status = 137;
let PAGE_show_menu = 138;
let PAGE_add_new_employee = 139;
let PAGE_edit_profile = 140;

// name for action categories breakup
let ACTIONS_CATEGORY_default_actions_all_roles = 141;

let PAGE_apply_emp_leave = 142;

let PAGE_page_dashboard = 143;

let PAGE_audit_inventory_list = 144;
let PAGE_user_inventory_details = 145;
let PAGE_unapproved_inventory = 146;
let PAGE_manage_holidays = 147;
let PAGE_add_inventory = 148;
let PAGE_add_template = 149;
let PAGE_multiple_inventory_upload = 150;
let PAGE_user_timeSheet = 151;
let PAGE_all_user_timesheet = 152;
let PAGE_pending_timesheets_per_month = 153;

//action
let ACTION_working_hours_summary = 201;
let ACTION_add_new_employee = 202;
let ACTION_add_user_working_hours = 203;
let ACTION_get_user_worktime_detail = 204;
let ACTION_update_user_day_summary = 205;
let ACTION_change_leave_status = 206;
let ACTION_get_my_leaves = 207;
let ACTION_get_enable_user = 208;
let ACTION_month_attendance = 209;
let ACTION_get_all_leaves = 210;
let ACTION_apply_leave = 211;
let ACTION_show_disabled_users = 212;
let ACTION_change_employee_status = 213;
let ACTION_get_holidays_list = 214;
let ACTION_admin_user_apply_leave = 215;
let ACTION_update_new_password = 216;
let ACTION_get_managed_user_working_hours = 217;
let ACTION_get_user_previous_month_time = 218;
let ACTION_get_all_user_previous_month_time = 219;
let ACTION_update_day_working_hours = 220;
let ACTION_delete_employee = 221;
let ACTION_add_hr_comment = 222;
let ACTION_add_extra_leave_day = 222;
let ACTION_send_request_for_doc = 223;
let ACTION_update_user_entry_exit_time = 224;
let ACTION_save_google_payslip_drive_access_token = 225;
let ACTION_attendance_summary = 226;
let ACTION_user_day_summary = 227;
let ACTION_get_all_leaves_summary = 228;
let ACTION_get_users_leaves_summary = 229;
let ACTION_get_user_role_from_slack_id = 230;
let ACTION_get_all_not_approved_leave_of_user = 231;
let ACTION_approve_decline_leave_of_user = 232;
//let ACTION_cancel_applied_leave = 233;  // since this is also user in sal_info/api.php
let ACTION_cancel_applied_leave_admin = 234;
let ACTION_get_all_leaves_of_user = 235;
let ACTION_get_user_current_status = 236;
let ACTION_get_role_from_slackid = 237;
let ACTION_updatebandwidthstats = 238;
let ACTION_save_bandwidth_detail = 239;
let ACTION_get_bandwidth_detail = 240;
let ACTION_validate_unique_key = 241;
let ACTION_send_slack_msg = 242;
let ACTION_get_all_users_detail = 243;
let ACTION_get_holiday_types_list = 244;

let ACTION_get_all_clients = 301;
let ACTION_get_client_detail = 302;
let ACTION_create_new_client = 303;
let ACTION_update_client_details = 304;
let ACTION_create_client_invoice = 305;
let ACTION_delete_invoice = 306;

let ACTION_delete_role = 401;
let ACTION_assign_user_role = 402;
let ACTION_list_all_roles = 403;
let ACTION_update_role = 404;
let ACTION_add_roles = 405;

let ACTION_get_machine_count = 501;
let ACTION_get_machine_status_list = 502;
let ACTION_add_machine_status = 503;
let ACTION_add_machine_type = 504;
let ACTION_get_machine_type_list = 505;
let ACTION_delete_machine_status = 506;
let ACTION_add_office_machine = 507;
let ACTION_update_office_machine = 508;
let ACTION_get_machine = 509;
let ACTION_get_machines_detail = 510;
let ACTION_remove_machine_detail = 511;
let ACTION_assign_user_machine = 512;
let ACTION_get_user_machine = 513;

let ACTION_unassigned_my_inventory = 514;
let ACTION_get_unassigned_inventories = 515;
let ACTION_get_unapproved_inventories = 516;
let ACTION_get_my_inventories = 517;
let ACTION_add_inventory_comment = 518;
let ACTION_add_inventory_audit = 519;
let ACTION_get_inventory_audit_status_month_wise = 520;
let ACTION_delete_sold_inventories = 521;

//actions not required token
let ACTION_login = 601;
let ACTION_logout = 602;
let ACTION_forgot_password = 603;
let ACTION_get_days_between_leaves = 604;

//template actions
let ACTION_get_template_variable = 701;
let ACTION_create_template_variable = 702;
let ACTION_update_template_variable = 703;
let ACTION_delete_template_variable = 704;
let ACTION_get_email_template = 705;
let ACTION_create_email_template = 706;
let ACTION_update_email_template = 707;
let ACTION_delete_email_template = 708;
let ACTION_get_email_template_byId = 709;

//team actions
let ACTION_add_team_list = 801;
let ACTION_get_team_list = 802;
let ACTION_get_team_users_detail = 803;

//policy documents
let ACTION_get_user_policy_document = 901;
let ACTION_update_user_policy_document = 902;
let ACTION_get_policy_document = 903;
let ACTION_save_policy_document = 904;

//lunch actions
let ACTION_get_lunch_stats = 7001;
let ACTION_get_lunch_break_detail = 7002;
let ACTION_lunch_break = 7003;

// profile, employee, salary .bank
let ACTION_get_user_profile_detail = 8001;
let ACTION_update_user_profile_detail = 8002;
let ACTION_update_user_bank_detail = 8003;
let ACTION_create_user_salary = 8004;
let ACTION_create_employee_salary_slip = 8005;
let ACTION_get_user_manage_payslips_data = 8006;
let ACTION_get_user_document = 8007;
let ACTION_delete_user_document = 8008;
let ACTION_delete_salary = 8009;
let ACTION_send_payslips_to_employees = 8010;
let ACTION_send_employee_email = 8011;
let ACTION_cancel_applied_leave = 8012;
let ACTION_create_pdf = 8013;
let ACTION_update_read_document = 8014;
let ACTION_get_user_salary_info = 8015;
let ACTION_get_user_profile_detail_by_id = 8016;
let ACTION_update_user_profile_detail_by_id = 8017;
let ACTION_update_user_bank_detail_by_id = 8018;
let ACTION_get_user_document_by_id = 8019;
let ACTION_get_user_salary_info_by_id = 8020;

let ACTION_get_employee_life_cycle = 8021;
let ACTION_update_employee_life_cycle = 8022;

let ACTION_update_user_meta_data = 8023;
let ACTION_delete_user_meta_data = 8024;
let ACTION_get_user_meta_data = 8025;
let ACTION_employee_punch_time = 8026;
let ACTION_get_employee_recent_punch_time = 8027;
let ACTION_get_employee_punches_by_date = 8028;
let ACTION_get_employees_monthly_attendance = 8029;
let ACTION_get_my_rh_leaves = 8030;
let ACTION_get_user_rh_stats = 8031;
let ACTION_get_all_users_rh_stats = 8032;
let ACTION_get_enabled_users_brief_details = 8033;
let ACTION_update_page_status = 8034;
let ACTION_get_all_pages = 8035;

let ACTION_update_employee_allocated_leaves = 8036;
let ACTION_update_employee_final_leave_balance = 8037;

let ACTION_user_rh_list_for_compensation = 8038;
let ACTION_get_user_timesheet = 8039;
let ACTION_get_user_submitted_timesheet = 8040;
let ACTION_update_user_timesheet_status = 8041;
let ACTION_user_timesheet_entry = 8042;
let ACTION_submit_timesheet = 8043;

let ACTION_get_user_tms_report = 8044;
let ACTION_pending_timesheets_per_month = 8045;
let ACTION_update_user_full_timesheet_status = 8046;

//notification
let NOTIFICATION_apply_leave = 1001;
let NOTIFICATION_update_leave_status = 1002;
let NOTIFICATION_add_user_working_hours = 1003;

// action approve reject manual attendance
let ACTION_add_manual_attendance = 11001;
let ACTION_reject_manual_attendance = 11002;
let ACTION_approve_manual_attendance = 11003;
let ACTION_get_average_working_hours = 11004;

// action for ETHER
let ACTION_update_user_eth_token = 22001;

// action for config
let ACTION_get_generic_configuration = 33001;

let ACTION_update_login_type_status = 44001;
let ACTION_config_update_alternate_saturdays = 44002;
let ACTION_get_employee_complete_information = 44003;

let ACTION_inventory_unassign_request = 44004;

let ACTION_upload_attendance = 44005;

let ACTION_add_holiday = 44006;
let ACTION_delete_holiday = 44007;

let ACTION_update_employee_password = 44008;

let ACTION_get_temp_uploaded_inventory_files = 44009;
let ACTION_delete_temp_uploaded_inventory_file = 44010;

let getAllPages = async () => {
  let array = [
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_login,
      name: "login",
      description: "PAGE - For All - Login",
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_page_dashboard,
      name: "page_dashboard",
      description: "PAGE - For All - Dashboard",
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_logout,
      name: "logout",
      description: "PAGE - For All - Logout",
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_holidays,
      name: "holidays",
      description: "PAGE - For All - Holidays",
      actions_list: [
        {
          id: ACTION_get_holidays_list,
          name: "get_holidays_list",
          description: "Can view holidays list",
        },
      ],
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_salary,
      name: "salary",
      description: "PAGE - For All - My Salary",
      actions_list: [
        {
          id: ACTION_get_user_salary_info,
          name: "get_user_salary_info",
          description: "Can view self salary & payslips",
        },
      ],
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_apply_leave,
      secure_level: "",
      name: "apply_leave",
      description: "PAGE - For All - Apply Leave",
      actions_list: [
        {
          id: ACTION_apply_leave,
          name: "apply_leave",
          description: "Employee can apply his own leave",
        },
      ],
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_policy_documents,
      name: "policy_documents",
      description: "PAGE - For All - Policy Documents",
      actions_list: [
        {
          id: ACTION_get_user_policy_document,
          name: "get_user_policy_document",
          description: "Show all policy documents",
        },
      ],
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_documents,
      name: "documents",
      description: "PAGE - For All - My Documents",
      actions_list: [
        {
          id: ACTION_get_user_document,
          name: "get_user_document",
          description: "Can view self documents",
        },
      ],
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_my_inventory,
      name: "my_inventory",
      description: "PAGE - For All - My Inventory",
      actions_list: [
        {
          id: ACTION_get_unassigned_inventories,
          name: "get_unassigned_inventories",
          description: "List unassigned inventories",
        },
        {
          id: ACTION_get_my_inventories,
          name: "get_my_inventories",
          description: "Can view self inventories",
        },
        {
          id: ACTION_add_inventory_audit,
          name: "add_inventory_audit",
          description: "Can do inventory audit",
        },
        {
          id: ACTION_unassigned_my_inventory,
          name: "unassigned_my_inventory",
          description: "Can unassign inventory",
        },
        {
          id: ACTION_inventory_unassign_request,
          name: "inventory_unassign_request",
          description: "Can raise inventory unassign request",
        },
      ],
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_my_leaves,
      name: "my_leaves",
      description: "PAGE - For All - My Leaves",
      actions_list: [
        {
          id: ACTION_get_my_leaves,
          name: "get_my_leaves",
          description: "Can view leaves",
        },
        {
          id: ACTION_get_my_rh_leaves,
          name: "get_my_rh_leaves",
          description: "Can view RH leaves",
        },
        {
          id: ACTION_get_user_rh_stats,
          name: "get_user_rh_stats",
          description: "Can view RH stats",
        },
        {
          id: ACTION_user_rh_list_for_compensation,
          name: "user_rh_list_for_compensation",
          description: "Can view RH List to apply compensation",
        },
        {
          id: ACTION_cancel_applied_leave,
          name: "cancel_applied_leave",
          description: "Can cancel applied leaves",
        },
      ],
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_my_profile,
      name: "my_profile",
      description:
        "PAGE - For All - My Profile  Employee can view own profile details ",
      actions_list: [
        {
          id: ACTION_get_user_profile_detail,
          name: "get_user_profile_detail",
          description: "Can view own profile details",
        },
        {
          id: ACTION_get_user_salary_info,
          name: "get_user_salary_info",
          description: "Can view own salary details",
        },
        {
          id: ACTION_update_user_profile_detail,
          name: "update_user_profile_detail",
          description: "Can update own profile details",
        },
        {
          id: ACTION_update_new_password,
          name: "update_new_password",
          description: "Can update own password",
        },
        {
          id: ACTION_update_user_bank_detail,
          name: "update_user_bank_detail",
          description: "Can update bank details",
        },
      ],
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_edit_profile,
      name: "edit_profile",
      description:
        "PAGE - Edit Profile  Employee can edit own profile details ",
      actions_list: [
        {
          id: ACTION_get_user_profile_detail,
          name: "get_user_profile_detail",
          description: "Can view own profile details",
        },
        {
          id: ACTION_get_user_salary_info,
          name: "get_user_salary_info",
          description: "Can view own salary details",
        },
        {
          id: ACTION_update_user_profile_detail,
          name: "update_user_profile_detail",
          description: "Can update own profile details",
        },
        {
          id: ACTION_update_new_password,
          name: "update_new_password",
          description: "Can update own password",
        },
        {
          id: ACTION_update_user_bank_detail,
          name: "update_user_bank_detail",
          description: "Can update bank details",
        },
      ],
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_monthly_attendance,
      name: "monthly_attendance",
      description: "Employee can view month attendance / can add manual time",
      actions_list: [
        {
          id: ACTION_month_attendance,
          name: "month_attendance",
          description: "Can view month attendance",
        },
        {
          id: ACTION_user_day_summary,
          name: "user_day_summary",
          description: "Can view single day summary when clicked on date",
        },
        {
          id: ACTION_add_manual_attendance,
          name: "add_manual_attendance",
          description: "Can add manual time",
        },
      ],
    },
    {
      // baseCheck = "defaultForAllRoles",
      id: PAGE_uploadAttendance,
      name: "uploadAttendance",
      description: "Can upload attendance sheet",
      defaultForRoles: ["HR", "HR Payroll Manager", "Attendance Uploader"],
      actions_list: [
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        {
          id: ACTION_upload_attendance,
          name: "ACTION_upload_attendance",
          description: "Access to upload attendance",
        },
      ],
    },
    {
      // baseCheck = "defaultForAllRoles",
      id: PAGE_manage_holidays,
      name: "manageolidays",
      description: "PAGE - Manage Holidays",
      defaultForRoles: [
        "HR",
        "HR Payroll Manager",
        // "Attendance Uploader",/
      ],
      actions_list: [
        {
          id: ACTION_get_holidays_list,
          name: "get_holidays_list",
          description: "Can view holidays list",
        },
        {
          id: ACTION_add_holiday,
          name: "add_holiday",
          description: "Can add new holiday",
        },
        {
          id: ACTION_delete_holiday,
          name: "delete_holiday",
          description: "Can delete holiday",
        },
      ],
    },
    {
      // baseCheck = "defaultForAllRoles",
      id: PAGE_inventory_system,
      name: "inventryOverviewDetail",
      description: "Manage Inventory - Can overview inventories",
      defaultForRoles: [
        "HR",
        "HR Payroll Manager",
        "Inventory Manager",
        // "Attendance Uploader",/
      ],
      actions_list: [
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        {
          id: ACTION_get_machine_status_list,
          name: "get_machine_status_list",
          description: "List machine statuses type",
        },
        {
          id: ACTION_get_machine_count,
          name: "get_machine_count",
          description: "List stats of all inventories",
        },
        {
          id: ACTION_get_inventory_audit_status_month_wise,
          name: "get_inventory_audit_status_month_wise",
          description: "View inventories audit report",
        },
        {
          id: ACTION_get_machines_detail,
          name: "get_machines_detail",
          description: "Get all available inventories list",
        },
        {
          id: ACTION_get_machine_type_list,
          name: "get_machine_type_list",
          description: "List available inventory types",
        },
        {
          id: ACTION_get_unapproved_inventories,
          name: "get_unapproved_inventories",
          description: "Can view unapproved inventories",
        },
        {
          id: ACTION_get_user_profile_detail_by_id,
          name: "get_user_profile_detail_by_id",
          description: "Can access any employee profile details",
        },
        {
          id: ACTION_get_machine,
          name: "get_machine",
          description: "View inventory details",
        },
        {
          id: ACTION_assign_user_machine,
          name: "assign_user_machine",
          description: "Assign inventory to employee",
        },
        {
          id: ACTION_add_inventory_comment,
          name: "add_inventory_comment",
          description: "Can add comment to an inventory",
        },
        {
          id: ACTION_add_machine_status,
          name: "add_machine_status",
          description: "Can add new inventory status type",
        },
        {
          id: ACTION_add_machine_type,
          name: "add_machine_type",
          description: "Can add new inventory type",
        },
        {
          id: ACTION_delete_machine_status,
          name: "delete_machine_status",
          description: "Can delete inventory status type",
        },
        {
          id: ACTION_remove_machine_detail,
          name: "remove_machine_detail",
          description: "Can delete inventory",
        },
        {
          id: ACTION_delete_sold_inventories,
          name: "delete_sold_inventories",
          description: "Can delete sold inventory",
        },
        {
          id: ACTION_update_office_machine,
          name: "update_office_machine",
          description: "Can update inventory",
        },
      ],
    },
    {
      id: PAGE_add_template,
      name: "addTemplate",
      description: "Add Template",
      actions_list: [],
    },
    {
      id: PAGE_multiple_inventory_upload,
      name: "multipleInventoryUpload",
      description: "Manage Inventory - Can upload multiple inventory",
      defaultForRoles: [
        "HR",
        "HR Payroll Manager",
        "Inventory Manager",
        // "Attendance Uploader",/
      ],
    },
    {
      id: PAGE_add_inventory,
      name: "addInventory",
      description: "Manage Inventory - Can add new inventory",
      defaultForRoles: [
        "HR",
        "HR Payroll Manager",
        "Inventory Manager",
        // "Attendance Uploader",/
      ],
      actions_list: [
        {
          id: ACTION_get_enable_user,
          name: "get_machine_type_list",
          description: "List available inventory types",
        },
        {
          id: ACTION_get_machine_type_list,
          name: "get_machine_type_list",
          description: "List available inventory types",
        },
        {
          id: ACTION_get_machine_status_list,
          name: "get_machine_status_list",
          description: "List machine statuses type",
        },
        {
          id: ACTION_add_office_machine,
          name: "add_office_machine",
          description: "Access to add new inventory",
        },
      ],
    },
    {
      id: PAGE_audit_inventory_list,
      name: "audit_inventory_list",
      description: "Manage Inventory - Can manage inventories audit",
      defaultForRoles: [
        "HR",
        "HR Payroll Manager",
        "Inventory Manager",
        // "Attendance Uploader",/
      ],
      actions_list: [
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        {
          id: ACTION_get_inventory_audit_status_month_wise,
          name: "get_inventory_audit_status_month_wise",
          description: "View inventories audit report",
        },
      ],
    },
    {
      id: PAGE_user_inventory_details,
      name: "user_inventory_details",
      description: "Manage Inventory - Can view employees inventories",
      defaultForRoles: [
        "HR",
        "HR Payroll Manager",
        "Inventory Manager",
        // "Attendance Uploader",/
      ],
      actions_list: [
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        {
          id: ACTION_get_user_profile_detail_by_id,
          name: "get_user_profile_detail_by_id",
          description: "Can access any employee profile details",
        },
      ],
    },
    {
      id: PAGE_unapproved_inventory,
      name: "unapproved_inventory",
      description: "Manage Inventory - Can manage unassigned inventories",
      defaultForRoles: [
        "HR",
        "HR Payroll Manager",
        "Inventory Manager",
        // "Attendance Uploader",/
      ],
      actions_list: [
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        {
          id: ACTION_get_machine_count,
          name: "get_machine_count",
          description: "List stats of all inventories",
        },
        {
          id: ACTION_get_machine_status_list,
          name: "get_machine_status_list",
          description: "List machine statuses type",
        },
        {
          id: ACTION_get_machine_type_list,
          name: "get_machine_type_list",
          description: "List available inventory types",
        },
        {
          id: ACTION_get_machines_detail,
          name: "get_machines_detail",
          description: "Get all available inventories list",
        },
        {
          id: ACTION_remove_machine_detail,
          name: "remove_machine_detail",
          description: "Can delete inventory",
        },
      ],
    },
    {
      id: PAGE_home,
      secure_level: "5/5",
      name: "home",
      description:
        "Can view all employees month attendance / can add manual time of employees",
      defaultForRoles: [
        "HR",
        "HR Payroll Manager",
        // 'Inventory Manager',
        // "Attendance Uploader",/
      ],
      actions_list: [
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        {
          id: ACTION_month_attendance,
          name: "month_attendance",
          description: "Can view month attendance",
        },
        {
          id: ACTION_user_day_summary,
          name: "user_day_summary",
          description: "Can view single day summary when clicked on date",
        },
        {
          id: ACTION_update_user_day_summary,
          name: "update_user_day_summary",
          description: "Can add employee manual attendance",
        },
      ],
    },
    {
      id: PAGE_all_employee,
      secure_level: "5/5",
      name: "all_employee",
      description:
        "Page - Can view all employees brief details including salary",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        {
          id: ACTION_get_enabled_users_brief_details,
          name: "get_enabled_users_brief_details",
          description: "Can view all employees brief details including salary",
        },
        {
          id: ACTION_get_user_salary_info_by_id,
          name: "get_user_salary_info_by_id",
          description: "Can access any employee salary",
        },
      ],
    },
    {
      id: PAGE_disabled_employees,
      secure_level: "5/5",
      name: "disabled_employees",
      description: "Page - Can view all disabled/Ex employee, Enable employees",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        {
          id: ACTION_show_disabled_users,
          name: "show_disabled_users",
          description: "Can view all disabled employees",
        },
        {
          id: ACTION_change_employee_status,
          name: "change_employee_status",
          description: "Can enable a disabled employee",
        },
        {
          id: ACTION_get_user_document_by_id,
          name: "get_user_document_by_id",
          description: "Can access any employee documents",
        },
        {
          id: ACTION_get_user_manage_payslips_data,
          name: "get_user_manage_payslips_data",
          description: "Can access any employee last payslips",
        },
      ],
    },
    {
      id: PAGE_view_salary,
      secure_level: "5/5",
      name: "view_salary",
      description:
        "Page - View all employees Salaries, Last Increment, Next Increment",
      defaultForRoles: [
        // "HR",
        "HR Payroll Manager",
      ],
      actions_list: [
        {
          id: ACTION_get_all_users_detail,
          name: "get_all_users_detail",
          description: "Get all employees details",
        },
      ],
    },
    {
      id: PAGE_add_new_employee,
      secure_level: "2/5",
      name: "add_new_employee",
      description: "Page - Can Add New Employee",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        {
          id: ACTION_add_new_employee,
          name: "add_new_employee",
          description: "Right to add new employee",
        },
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        {
          id: ACTION_update_user_profile_detail_by_id,
          name: "update_user_profile_detail_by_id",
          description: "Update employee details on id basis",
        },
      ],
    },
    {
      id: PAGE_manage_users,
      secure_level: "5/5",
      name: "manage_users",
      description:
        "Page - Employees Management  Update Profile/ELC, Disable User, View Bank/Payslips/Douments/Inventories of employee ",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        {
          id: ACTION_get_team_list,
          name: "get_team_list",
          description: "List of all teams available",
        },
        {
          id: ACTION_get_user_profile_detail_by_id,
          name: "get_user_profile_detail_by_id",
          description: "Can access any employee profile details",
        },
        {
          id: ACTION_get_user_document_by_id,
          name: "get_user_document_by_id",
          description: "Can access any employee documents",
        },
        {
          id: ACTION_get_user_manage_payslips_data,
          name: "get_user_manage_payslips_data",
          description: "Can access any employee last payslips",
        },
        {
          id: ACTION_get_employee_life_cycle,
          name: "get_employee_life_cycle",
          description: "Can access any employee life cycle i.e ELC",
        },
        {
          id: ACTION_update_employee_life_cycle,
          name: "update_employee_life_cycle",
          description: "Can update employee life cycle i.e ELC",
        },
        {
          id: ACTION_get_user_salary_info_by_id,
          name: "get_user_salary_info_by_id",
          description: "Can access any employee salary",
        },
        {
          id: ACTION_change_employee_status,
          name: "change_employee_status",
          description: "Enable/Disable employee",
        },
        {
          id: ACTION_update_user_profile_detail_by_id,
          name: "update_user_profile_detail_by_id",
          description: "Update employee details on id basis",
        },
        {
          id: ACTION_delete_user_document,
          name: "delete_user_document",
          description: "Can delete employee documents",
        },
        {
          id: ACTION_update_employee_password,
          name: "update_employee_password",
          description: "Can update employee password",
        },
      ],
    },
    {
      id: PAGE_manage_roles,
      secure_level: "5/5",
      name: "manage_roles",
      description:
        "Page - Roles Management  Add/Edit/Delete Roles, Assign Role to Employee ",
      actions_list: [
        {
          id: ACTION_list_all_roles,
          name: "list_all_roles",
          description: "Can view all roles",
        },
        {
          id: ACTION_delete_role,
          name: "delete_role",
          description: "Can delete role",
        },
        {
          id: ACTION_assign_user_role,
          name: "assign_user_role",
          description: "Can assign role to employee",
        },
        {
          id: ACTION_update_role,
          name: "update_role",
          description: "Can update role",
        },
        {
          id: ACTION_add_roles,
          name: "add_roles",
          description: "Can add new role",
        },
      ],
    },
    {
      id: PAGE_manage_leaves,
      secure_level: "5/5",
      name: "manage_leaves",
      description: "Page - Leaves Management  View all leaves ",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        {
          id: ACTION_get_all_leaves,
          name: "get_all_leaves",
          description: "Can view all leaves",
        },
        {
          id: ACTION_change_leave_status,
          name: "change_leave_status",
          description: "Can approve/reject leaves",
        },
        {
          id: ACTION_send_request_for_doc,
          name: "send_request_for_doc",
          description: "Can add request doc with comment on applied leave",
        },
        // ------------
        {
          id: ACTION_add_extra_leave_day,
          name: "add_extra_leave_day",
          description: "Can add extra leave day",
        },
        {
          id: ACTION_add_hr_comment,
          name: "add_hr_comment",
          description: "Can add comment",
        },
      ],
    },
    {
      id: PAGE_leaves_summary,
      secure_level: "1/5",
      name: "leaves_summary",
      description:
        "Page - Leaves Summary  Can view all employees leaves summary month wise ",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        {
          id: ACTION_get_all_leaves_summary,
          name: "get_all_leaves_summary",
          description: "Get all employees leaves summary month wise ",
        },
      ],
    },
    {
      id: PAGE_rh_status,
      secure_level: "1/5",
      name: "rh_status",
      description:
        "Page - RH Summary  Can view all employees RH leaves summary year wise",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        {
          id: ACTION_get_all_users_rh_stats,
          name: "get_all_users_rh_stats",
          description: "Get summary of RH leaves of all employees year wise",
        },
      ],
    },
    {
      id: PAGE_apply_emp_leave,
      secure_level: "5/5",
      name: "apply_emp_leave",
      description: "Page - Apply Leave of employees",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        // get_enable_user is also used in some other category
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        {
          id: ACTION_admin_user_apply_leave,
          name: "admin_user_apply_leave",
          description: "Can apply any employee leave",
        },
        // apply_leave is also used in some other category
        {
          id: ACTION_apply_leave,
          name: "apply_leave",
          description: "Employee can apply his own leave",
        },
      ],
    },
    {
      id: PAGE_manage_working_hours,
      secure_level: "5/5",
      name: "manage_working_hours",
      description:
        "Page - Manage office day working hours  View/Add/Edit office working hours for a day of any month ",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        {
          id: ACTION_working_hours_summary,
          name: "working_hours_summary",
          description: "Can view month wise office working hours",
        },
        {
          id: ACTION_update_day_working_hours,
          name: "update_day_working_hours",
          description: "Can update office day working hours",
        },
      ],
    },
    {
      id: PAGE_manage_user_working_hours,
      secure_level: "5/5",
      name: "manage_user_working_hours",
      description:
        "Page - Manage employees day working hours  View/Add/Edit employees office working hours for a day of any month ",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        // get_enable_user is also used in some other category
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        {
          id: ACTION_get_managed_user_working_hours,
          name: "get_managed_user_working_hours",
          description: "Show month wise employee day working hours",
        },
        {
          id: ACTION_add_user_working_hours,
          name: "add_user_working_hours",
          description: "Can add any employee day working hours",
        },
      ],
    },
    {
      id: PAGE_manage_user_pending_hours,
      secure_level: "5/5",
      name: "manage_user_pending_hours",
      description:
        "Page - Manage pending hours  View/Merge/Apply Leave on employees pending time ",
      actions_list: [
        {
          id: ACTION_get_all_user_previous_month_time,
          name: "get_all_user_previous_month_time",
          description: "Can view all employees last month time",
        },
        {
          id: ACTION_admin_user_apply_leave,
          name: "admin_user_apply_leave",
          description: "Can apply any employee leave",
        },
      ],
    },
    {
      id: PAGE_team_view,
      secure_level: "5/5",
      name: "team_view",
      description: "Page - Team Management  View/Add/Update/Delete Teams ",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        {
          id: ACTION_get_team_list,
          name: "get_team_list",
          description: "Can view team list",
        },
        {
          id: ACTION_add_team_list,
          name: "add_team_list",
          description: "Can Add/Delete team",
        },
        {
          id: ACTION_get_team_users_detail,
          name: "get_team_users_detail",
          description: "Can view employees team wise",
        },
      ],
    },
    {
      id: PAGE_settings,
      secure_level: "5/5",
      name: "settings",
      description:
        "Page - System Settings  Manage Login types, Manage Password reset setting",
      actions_list: [
        {
          id: ACTION_update_login_type_status,
          name: "update_login_type_status",
          description: "Can enable/disable login options to show on login page",
        },
        {
          id: ACTION_config_update_alternate_saturdays,
          name: "config_update_alternate_saturdays",
          description: "Can set which saturday will be on or off",
        },
      ],
    },
    {
      id: PAGE_health_stats,
      secure_level: "5/5",
      name: "health_stats",
      description: "Page - Can view application/DB health status",
      actions_list: [],
    },
    {
      id: PAGE_manage_payslips,
      secure_level: "5/5",
      name: "manage_payslips",
      description: "Payslips Management  Create/View/Send Salary Slips ",
      defaultForRoles: ["HR Payroll Manager"],
      actions_list: [
        // get_enable_user is also used in some other category
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        // get_user_manage_payslips_data is also used in some other category
        {
          id: ACTION_get_user_manage_payslips_data,
          name: "get_user_manage_payslips_data",
          description: "Can access any employee last payslips",
        },
        {
          id: ACTION_create_employee_salary_slip,
          name: "create_employee_salary_slip",
          description: "Can create employees payslip",
        },
        {
          id: ACTION_send_payslips_to_employees,
          name: "send_payslips_to_employees",
          description: "Can send payslips to employees",
        },
        {
          id: ACTION_save_google_payslip_drive_access_token,
          name: "save_google_payslip_drive_access_token",
          description: "Can save google drive access token",
        },
        // get_user_salary_info_by_id is also used in some other category
        {
          id: ACTION_get_user_salary_info_by_id,
          name: "get_user_salary_info_by_id",
          description: "Can access any employee salary",
        },
      ],
    },
    {
      id: PAGE_mail_templates,
      secure_level: "5/5",
      name: "mail_templates",
      description:
        "Page - Manage email templates  Create email templates, View employee complete details ",
      defaultForRoles: ["HR Payroll Manager"],
      actions_list: [
        {
          id: ACTION_get_email_template,
          name: "get_email_template",
          description: "Show all email templates",
        },
        {
          id: ACTION_update_email_template,
          name: "update_email_template",
          description: "Can update email template",
        },
        {
          id: ACTION_get_email_template_byId,
          name: "get_email_template_byId",
          description: "Can access specific email template",
        },
        {
          id: ACTION_get_template_variable,
          name: "get_template_variable",
          description: "Show all template variables",
        },
        {
          id: ACTION_send_employee_email,
          name: "send_employee_email",
          description: "Can send email to employee",
        },
        {
          id: ACTION_create_pdf,
          name: "create_pdf",
          description: "Can create PDF file",
        },
        {
          id: ACTION_get_employee_complete_information,
          name: "get_employee_complete_information",
          description:
            "Can view employee complete details including profile, salary, increment.",
        },
      ],
    },
    {
      id: PAGE_manage_salary,
      secure_level: "5/5",
      name: "manage_salary",
      description: "Page - Manage Salaries",
      defaultForRoles: ["HR Payroll Manager"],
      actions_list: [
        // get_enable_user is also used in some other category
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        // get_user_salary_info_by_id is also used in some other category
        {
          id: ACTION_get_user_salary_info_by_id,
          name: "get_user_salary_info_by_id",
          description: "Can access any employee salary",
        },
        {
          id: ACTION_delete_salary,
          name: "delete_salary",
          description: "Can delete salary",
        },
        {
          id: ACTION_update_employee_allocated_leaves,
          name: "update_employee_allocated_leaves",
          description: "Can update employee allocated leaves",
        },
        {
          id: ACTION_update_employee_final_leave_balance,
          name: "update_employee_final_leave_balance",
          description: "Can update employee final leave balance",
        },
      ],
    },
    {
      id: PAGE_show_menu,
      secure_level: "1/5",
      name: "show_menu",
      description: "Page - Choose which menu items to show in sidebar",
      actions_list: [
        {
          id: ACTION_get_all_pages,
          name: "get_all_pages",
          description: "Show all available menu items",
        },
        {
          id: ACTION_update_page_status,
          name: "update_page_status",
          description: "Can update whether to Show or Hide menu item",
        },
      ],
    },
    {
      id: PAGE_upload_policy_documents,
      secure_level: "5/5",
      name: "upload_policy_documents",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      description:
        "Page - Manage policy documents  View/Add/Delete policy documents ",
      actions_list: [
        {
          id: ACTION_get_user_policy_document,
          name: "get_user_policy_document",
          description: "Show all policy documents",
        },
        {
          id: ACTION_save_policy_document,
          name: "save_policy_document",
          description: "Can add/delete new policy document",
        },
        //---
        { id: ACTION_get_policy_document, name: "get_policy_document" }, // this one is doubted
        ////  array id :> self::$ACTION_update_user_policy_document, 'name' :> 'update_user_policy_document' ,
      ],
    },
    {
      id: PAGE_add_documents,
      secure_level: "5/5",
      name: "add_documents",
      description: "Page - Can add employees documents",
      defaultForRoles: ["HR", "HR Payroll Manager"],
      actions_list: [
        // get_enable_user is also used in some other category
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
      ],
    },
    {
      baseCheck: "defaultForAllRoles",
      id: ACTIONS_CATEGORY_default_actions_all_roles,
      name: "Category Default Actions For all Roles",
      description: "Category Default Actions For all Roles",
      actions_list: [
        {
          id: ACTION_apply_leave,
          name: "apply_leave",
          description: "Employee can apply his own leave",
        },
        {
          id: ACTION_get_machine_status_list,
          name: "get_machine_status_list",
          description: "List machine statuses type",
        },
        {
          id: ACTION_get_machines_detail,
          name: "get_machines_detail",
          description: "Get all available inventories list",
        },
        {
          id: ACTION_get_machine_type_list,
          name: "get_machine_type_list",
          description: "List available inventory types",
        },
        {
          id: ACTION_assign_user_machine,
          name: "assign_user_machine",
          description: "Assign inventory to employee",
        },
        {
          id: ACTION_month_attendance,
          name: "month_attendance",
          description: "Can view month attendance",
        },
        {
          id: ACTION_user_day_summary,
          name: "user_day_summary",
          description: "Can view single day summary when clicked on date",
        },
        {
          id: ACTION_add_manual_attendance,
          name: "add_manual_attendance",
          description: "Can add manual time",
        },
        {
          id: ACTION_get_machine,
          name: "get_machine",
          description: "View inventory details",
        },
        //---------
        {
          id: ACTION_update_user_policy_document,
          name: "update_user_policy_document",
          description: "Will update policy doc read status",
        },
      ],
    },
    {
      baseCheck: "defaultForAllRoles",
      id: PAGE_user_timeSheet,
      name: "user_timeSheet",
      description: "Page - User Time Sheet",
      actions_list: [
        {
          id: ACTION_get_user_timesheet,
          name: "get_user_timesheet",
          description: "User Time Sheet",
        },
        {
          id: ACTION_user_timesheet_entry,
          name: "user_timesheet_entry",
          description: "User Time Sheet Entry",
        },
        {
          id: ACTION_submit_timesheet,
          name: "submit_timesheet",
          description: "User Time Sheet Submit",
        },
        {
          id: ACTION_get_user_tms_report,
          name: "get_user_tms_report",
          description: "User Tms Report",
        },
      ],
    },
    {
      id: PAGE_all_user_timesheet,
      secure_level: "5/5",
      name: "all_user_timesheet",
      description: "Page - All User Time Sheet",
      actions_list: [
        // get_enable_user is also used in some other category
        {
          id: ACTION_get_enable_user,
          name: "get_enable_user",
          description: "List of all enable employees",
        },
        {
          id: ACTION_get_user_submitted_timesheet,
          name: "get_user_submitted_timesheet",
          description: "Get User Submitted Time Sheet",
        },
        {
          id: ACTION_update_user_timesheet_status,
          name: "update_user_timesheet_status",
          description: "Update Status for User Time Sheet Entry",
        },
      ],
    },
    {
      id: PAGE_pending_timesheets_per_month,
      secure_level: "5/5",
      name: "pending_timesheets_per_month",
      description: "Page - Pending Time Sheet Per Month",
      actions_list: [
        {
          id: ACTION_pending_timesheets_per_month,
          name: "pending_timesheets_per_month",
          description: "User Pending Time Sheets Per Month",
        },
        {
          id: ACTION_update_user_full_timesheet_status,
          name: "update_user_full_timesheet_status",
          description: "Update User Full Time Sheet Status",
        },
      ],
    },
  ];
  // console.log(array);
  return array;
};

let getAllActions = async () => {
  let array = [];
  let allPages = await getAllPages();
  for (let pages in allPages) {
    if (allPages[pages].actions_list) {
      allPages[pages].actions_list.forEach((element) => {
        array.push(element);
      });
    }
  }
  // console.log(array);
  return array;
  // arra
};

let getAllNotifications = async () => {
  return [];
};

module.exports = {
  getAllPages,
  getAllActions,
  getAllNotifications,
  PAGE_login,
  PAGE_logout,
  PAGE_policy_documents,
  PAGE_my_inventory
};




