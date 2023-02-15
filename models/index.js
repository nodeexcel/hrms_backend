const User = require("./userModel");
// const Address = require('./addressModel');
const MachineList = require("./machineListModel");
const MachineUser = require("./machineUserModel");
const InventoryTempFiles = require("./inventoryTempFilesModel");
const InventoryAuditMonthWise = require("./inventoryAuditMonthWiseModel");
const InventoryCommentsModel = require("./inventoryCommentsModel");
const FilesModel = require("./filesModel");
const MachineStatus = require("./machineStatusModel");
const Role = require("./roleModel");
const Config = require("./configModel");
const UserProfile = require("./userProfileModel");
const UserRole = require("./userRoleModel");
const RolesAction = require("./rolesActionsModel");
const RolesNotification = require("./rolesNotificationModel");
const RolesPage = require("./rolesPageModel");
const LifeCycle = require("./lifeCycleModel");
const Document = require("./documentModel");
const BankDetails = require("./bankDetailsModel");
const UserDocumentDetails = require("./userDocumentDetail");
const ElcStage = require("./elc_stage");
const ElcStagesSteps = require("./elc_stages_stepModel");
const LoginToken = require("./loginToken");

module.exports = {
  LoginToken,
  User,
  MachineList,
  MachineUser,
  InventoryTempFiles,
  InventoryAuditMonthWise,
  InventoryCommentsModel,
  FilesModel,
  MachineStatus,
  Role,
  Config,
  UserProfile,
  UserRole,
  RolesNotification,
  RolesAction,
  RolesPage,
  LifeCycle,
  BankDetails,
  Document,
  UserDocumentDetails,
  ElcStage,
  ElcStagesSteps,
};
