const db = require("../db");
const providers = require("../providers/creation-provider");
const reqValidate = require("../providers/error-check");
const jwt = require("jsonwebtoken");
const secret = require("../config");
const {
  refreshToken,
  getMachineDetail,
  AddMachineStatus,
  getMachineStatusList,
  getMachineCount,
  addMachineType,
  getAllMachinesDetail,
  api_getMyInventories,
  UpdateOfficeMachine,
  api_getUnassignedInventories,
  isUnassignInventoriesRequestPending,
  _getDateTimeData,
  getInventoriesAuditStatusForYearMonth,
  API_getTempUploadedInventoryFiles,
  API_deleteTempUploadedInventoryFile,
  removeMachineDetails,
  inventoryUnassignRequest,
  api_getUnapprovedInventories,
  inventoryOwnershipChangeRequest,
  assignUserMachine,
  getMachineTypeList,
} = require("../allFunctions");
const { response } = require("express");
exports.inventoryController = async (req, res, next) => {
  try {
    let request_Validate = await reqValidate(req);
    let machine_create = await db.MachineList.addOfficeMachine(req, db);
    req.body.obj_id = machine_create;
    if (machine_create != null) {
      res.status_code = 201;
      res.error = 0;
      res.message =
        "Inventory added successfully and need to be approved by admin!!";
      res.inventory_id = machine_create;
      return next();
    } else {
      res.status_code = 500;
      res.error = 1;
      res.message = "Error in adding new inventory ";
      return next();
    }
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.inventoryGetController = async (req, res, next) => {
  try {
    let machine_list = await db.MachineList.getAll();
    res.status_code = 201;
    res.data = machine_list;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.AssignUserMachineController = async (req, res, next) => {
  try {
    let logged_user_id = req.userData.id;
    //  let logged_user_id=req.userData.id;
    let ownership_change_request = false;
    let response;
    if (
      typeof req.body.ownership_change_request != "undefined" &&
      req.body.ownership_change_request == 1
    ) {
      ownership_change_request = true;
    }
    if (ownership_change_request == true) {
      response = await inventoryOwnershipChangeRequest(logged_user_id, req, db);
    } else {
      let machine_id = req.body.machine_id;
      let user_id = req.body.user_id;
      response = await assignUserMachine(
        machine_id,
        user_id,
        logged_user_id,
        req,
        db
      );
    }
    // //  if(typeof req.body.do_refresh_token!="undefinded"&&req.body.do_refresh_token==1){
    //   //  if(await isUnassignInventoriesRequestPending(db)==false){
    //    let newToken=await refreshToken(oldtoken,models)
    //    if(typeof response.data!="undefined"){
    //      response.data={};
    //    }
    //    response.data.new_token=newToken;
    //   //  }

    // //  }
    res.status_code = 200;
    res.message = response.message;
    res.error = response.error;
    return next();
    // let machine_create = await db.MachineUser.AssignMachine(req, db);
    // if (machine_create == "Done") {
    //   res.status_code = 201;
    //   res.error = 0;
    //   res.message =
    //     "Machine assigned Successfully !!";
    //   return next();
    // } else {
    //   res.status_code = 500;
    //   res.error = 1;
    //   res.message = "Sold status inventory cannnot be assign to any employee";
    //   return next()
    // }
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.inventoryAuditController = async (req, res, next) => {
  try {
    let audit_create = await db.InventoryCommentsModel.createAudit(req, db);
    res.status_code = 201;
    res.data = audit_create;
    res.message = "Created";
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getMyInventoryController = async (req, res, next) => {
  try {
    // console.log("getMyInventoryController");
    // let machine_list = await db.MachineList.GetMachine(req, db);
    // let machine_list = await db.MachineList.GetMachine(req, db);
    // console.log(machine_list)
    const loggeduserid = req.userData.id;
    const loggeduser_role = req.userData.role;
    let result = await api_getMyInventories(loggeduserid, loggeduser_role, db);
    if (
      typeof req.body.skip_inventory_audit != undefined &&
      req.body.skip_inventory_audit == 1
    ) {
      let lowerCaseLoggedUserRole = loggeduser_role.toLowerCase();
      if (
        lowerCaseLoggedUserRole == "hr" ||
        lowerCaseLoggedUserRole == "inventory manager" ||
        lowerCaseLoggedUserRole == "hr payroll manager" ||
        lowerCaseLoggedUserRole == "admin"
      ) {
        let addOnsRefreshToken = [];
        addOnsRefreshToken.skip_inventory_audit = true;
        let newToken = await refreshToken(
          req.headers.authorization,
          models,
          addOnsRefreshToken
        );
        res.data.new_token = newToken;
      }
    }
    res.status_code = 200;
    res.message = result.message;
    res.error = result.error;
    res.data = result.data;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getMachineController = async (req, res, next) => {
  try {
    let machine_list = await getMachineDetail(req.body.id, db, res);
    res.status_code = 200;
    res.data = machine_list;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.inventoryUpdateMachineController = async (req, res, next) => {
  try {
    let logged_user_id = req.userData.id;
    // let logged_user_id = req.userData.id;
    let updatedMachine = await UpdateOfficeMachine(logged_user_id, req, db);
    res.status_code = 200;
    res.message = updatedMachine.message;
    res.error = updatedMachine.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getUnassignedInventoryController = async (req, res, next) => {
  try {
    let logged_user_id = req.userData.id;
    let unassignedInventory = await api_getUnassignedInventories(
      logged_user_id,
      req,
      db
    );
    res.status_code = 200;
    res.error = unassignedInventory.error;
    res.message = unassignedInventory.message;
    res.data = unassignedInventory.data;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.addMachineStatusController = async (req, res, next) => {
  try {
    let audit_create = await AddMachineStatus(req, db);
    res.status_code = 201;
    res.message = "Created";
    res.data = audit_create;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getMachineStatusController = async (req, res, next) => {
  try {
    let machine_list = await getMachineStatusList(db);
    // console.log(machine_list.data)
    res.status_code = 200;
    res.error = machine_list.error;
    res.message = machine_list.message;
    res.data = machine_list.data;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.deleteMachineStatusController = async (req, res, next) => {
  try {
    let machine_list = await db.MachineStatus.DeleteStatus(req.body, res, db);
    if (machine_list) {
      res.status_code = 201;
      res.data = machine_list;
      return next();
    } else {
      res.status_code = 404;
      res.message = " status not found  to delete";
    }
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getMachineCountController = async (req, res, next) => {
  try {
    let machine_count = await getMachineCount(req, db);
    res.status_code = 200;
    res.error = machine_count.error;
    res.data = machine_count.data;
    res.message = machine_count.message;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.addMachineTypeController = async (req, res, next) => {
  try {
    let machineType = await addMachineType(req, db);
    res.status_code = 200;
    res.error = machineType.error;
    res.message = machineType.data.message;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getMachineTypeController = async (req, res, next) => {
  try {
    let machine_type_list = await getMachineTypeList(req, db);
    res.status_code = 200;
    res.error = machine_type_list.error;
    res.message = machine_type_list.message;
    res.data = machine_type_list.data;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getMachinesDetailController = async (req, res, next) => {
  try {
    let machineDetails;
    if (typeof req.body.sort != "undefined" && req.body.sort != "") {
      let sort = req.body.sort.trim();
      machineDetails = await getAllMachinesDetail(req, db, sort);
    }
    if (
      typeof req.body.status_sort != "undefined" &&
      req.body.status_sort != ""
    ) {
      let status_sort = req.body.status_sort.trim();
      machineDetails = await getAllMachinesDetail(
        req,
        db,
        (sort = false),
        status_sort
      );
    } else {
      machineDetails = await getAllMachinesDetail(req, db);
    }
    res.status_code = 200;
    res.data = machineDetails.data;
    res.error = machineDetails.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getUnapprovedInventoryControllers = async (req, res, next) => {
  try {
    let logged_user_id = req.userData.id;
    // let logged_user_id = req.userData.id;
    let unapprovedInventory = await api_getUnapprovedInventories(
      logged_user_id,
      req,
      db
    );
    res.status_code = 200;
    res.message = unapprovedInventory.message;
    res.data = unapprovedInventory.data;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.monthwiseAuditStatusController = async (req, res, next) => {
  try {
    let currentTime = await _getDateTimeData();
    let month;
    if (typeof req.body.month == "undefined" && req.body.month != "") {
      month = req.body.month;
    } else {
      month = currentTime["current_month_number"];
    }
    if (typeof req.body.year == "undefined" && req.body.year != "") {
      year = req.body.year;
    } else {
      year = currentTime["current_year_number"];
    }
    let resp = await getInventoriesAuditStatusForYearMonth(
      month,
      year,
      req,
      db
    );
    res.status_code = 200;
    res.error = resp.error;
    res.message = resp.message;
    res.data = resp.data;
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.inventoryUnassignRequestController = async (req, res, next) => {
  try {
    let inventory_id = req.body.inventory_id;
    let response = await inventoryUnassignRequest(inventory_id, req, db);
    res.status_code = 200;
    res.message = response.message;
    res.error = response.error;
    // res.message = "request Made";
    return next();
  } catch (error) {
    console.log(error);
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.getTempFilesController = async (req, res, next) => {
  try {
    let tempFiles = await API_getTempUploadedInventoryFiles(req, db);
    console.log(tempFiles, "++++++++++++++++++++++++++++++++++++++++++++++");
    res.status_code = 200;
    res.message = tempFiles.message;
    res.error = tempFiles.error;
    res.data = tempFiles.data;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.deleteTempFilesControllers = async (req, res, next) => {
  try {
    let deletedTempFiles = await API_deleteTempUploadedInventoryFile(req, db);
    res.status_code = 200;
    res.message = deletedTempFiles.message;
    res.error = deletedTempFiles.error;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};

exports.removeMachineController = async (req, res, next) => {
  try {
    let id = req.body.id;
    logged_user_id = req.userData.id;
    let removedMachine = await removeMachineDetails(
      id,
      logged_user_id,
      req,
      db
    );
    res.status_code = 200;
    res.error = removedMachine.error;
    res.message = removedMachine.message;
    return next();
  } catch (error) {
    res.status_code = 500;
    res.message = error.message;
    return next();
  }
};
