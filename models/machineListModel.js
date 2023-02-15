const db = require("../db");
const {
  getUserInventories,
  getUserRole,
  getInventoryFullDetails,
  is_policy_documents_read_by_user,
  getUserInfo,
  refreshToken,
  getInventoryHistory,
  addInventoryComment,
  assignUserMachine,
} = require("../allFunctions");
const { Op } = require("sequelize");
function machinelist(database, type) {
  const MachineList = database.define(
    "machines_list",
    {
      machine_type: {
        type: type.STRING,
        defaultValue: null,
      },
      machine_name: {
        type: type.STRING,
        defaultValue: null,
      },
      machine_price: {
        type: type.STRING,
        defaultValue: null,
      },
      serial_number: {
        type: type.STRING,
        defaultValue: 0,
      },
      date_of_purchase: {
        type: type.DATE,
        defaultValue: null,
      },
      mac_address: {
        type: type.STRING,
        defaultValue: 0,
      },
      operating_system: {
        type: type.STRING,
        defaultValue: null,
      },
      status: {
        type: type.STRING,
        defaultValue: null,
      },
      comments: {
        type: type.STRING,
        defaultValue: null,
      },
      warranty_end_date: {
        type: type.DATE,
        defaultValue: null,
      },
      bill_number: {
        type: type.STRING,
        defaultValue: 0,
      },
      warranty_comment: {
        type: type.STRING,
        defaultValue: null,
      },
      repair_comment: {
        type: type.STRING,
        defaultValue: null,
      },
      file_inventory_invoice: {
        type: type.INTEGER,
        defaultValue: null,
      },
      file_inventory_warranty: {
        type: type.INTEGER,
        defaultValue: null,
      },
      file_inventory_photo: {
        type: type.INTEGER,
        defaultValue: null,
      },
      warranty_years: {
        type: type.STRING,
        defaultValue: null,
      },
      approval_status: {
        type: type.INTEGER,
        // defaultValue: null
      },
      is_unassign_request: {
        type: type.INTEGER,
        defaultValue: null,
      },
      ownership_change_req_by_user: {
        type: type.INTEGER,
        // defaultValue: null
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
    }
  );
  MachineList.associate = (models) => {
    models.MachineList.hasOne(models.FilesModel, {
      foreignKey: "file_inventory_invoice",
      as: "file_inventory_invoice_id",
    });
    models.MachineList.hasOne(models.FilesModel, {
      foreignKey: "file_inventory_warranty",
      as: "file_inventory_warranty_id",
    });
    models.MachineList.hasOne(models.FilesModel, {
      foreignKey: "file_inventory_photo",
      as: "file_inventory_photo_id",
    });
  };

  MachineList.addOfficeMachine = async (req, db) => {
    try {
      // const loggeduserid = req.userData.data.id;
      const loggeduserid = req.userData.id;
      let creation = await MachineList.create({
        machine_type: req.body.machine_type,
        machine_name: req.body.machine_name,
        machine_price: req.body.machine_price,
        serial_number: req.body.serial_number,
        date_of_purchase: req.body.date_of_purchase,
        mac_address: req.body.mac_address,
        operating_system: req.body.operating_system,
        status: req.body.status,
        comments: req.body.unassign_comment,
        warranty_end_date: req.body.warranty_end_date,
        bill_number: req.body.bill_number,
        warranty_comment: req.body.warranty_comment,
        repair_comment: req.body.repair_comment,
        file_inventory_invoice: req.body.file_inventory_invoice,
        file_inventory_warranty: req.body.file_inventory_warranty,
        file_inventory_photo: req.body.temp_inventory_photo,
        warranty_years: req.body.warranty_years,
        approval_status: req.body.approval_status,
        is_unassign_request: req.body.is_unassign_request,
        ownership_change_req_by_user: req.body.ownership_change_req_by_user,
      });
      if (creation.id != null) {
        const machine_id = creation.id;
        if (req.body.user_id === "" || req.body.user_id == null) {
          if (req.body.unassign_comments != null) {
            const addInventoryComment1 = await addInventoryComment(
              creation.id,
              loggeduserid,
              db,
              req
            );
          } else {
            console.log("unassign comment is empty");
          }
        } else {
          const assign = await assignUserMachine(
            machine_id,
            req.body.user_id,
            loggeduserid,
            req,
            db
          );
        }
        await updateInventoryWithTempFile(
          loggeduserid,
          machine_id,
          db,
          req,
          req.body.user_id
        );
      } else {
        console.log("Error in adding new inventory");
      }
      return creation.id;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  };

  MachineList.getAll = async (limit, offset) => {
    try {
      let all_machine = await MachineList.findAll({ limit, offset });
      return all_machine;
    } catch (error) {
      throw new Error("Unable to locate all users");
    }
  };
  MachineList.GetMachine = async (reqBody, models) => {
    try {
      const loggeduserid = reqBody.userData.id;
      const loggeduser_role = reqBody.userData.role;
      let res = await api_getMyInventories(
        loggeduserid,
        loggeduser_role,
        models
      );
      if (
        typeof reqBody.body.skip_inventory_audit != undefined &&
        reqBody.body.skip_inventory_audit == 1
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
            reqBody.headers.authorization,
            models,
            addOnsRefreshToken
          );
          res.data.new_token = newToken;
        }
      }
    } catch (error) {
      console.log(error);
      throw new Error("Unable to locate all users");
    }
  };

  MachineList.updateMachine = async (reqBody) => {
    try {
      let update = await MachineList.update(
        {
          machine_type: reqBody.machine_type,
          machine_name: reqBody.machine_name,
          machine_price: reqBody.machine_price,
          serial_number: reqBody.serial_number,
          date_of_purchase: reqBody.date_of_purchase,
          mac_address: reqBody.mac_address,
          operating_system: reqBody.operating_system,
          status: reqBody.status,
          comments: reqBody.unassign_comment,
          warranty_end_date: reqBody.warranty_end_date,
          bill_number: reqBody.bill_number,
          warranty_comment: reqBody.warranty_comment,
          repair_comment: reqBody.repair_comment,
          file_inventory_invoice: reqBody.file_inventory_invoice,
          file_inventory_warranty: reqBody.file_inventory_warranty,
          file_inventory_photo: reqBody.temp_inventory_photo,
          warranty_years: reqBody.warranty_years,
          approval_status: reqBody.approval_status,
          is_unassign_request: reqBody.is_unassign_request,
          ownership_change_req_by_user: reqBody.ownership_change_req_by_user,
        },
        { where: { id: reqBody.id } }
      );
      return update;
    } catch (error) {
      throw new Error(error);
    }
  };

  MachineList.removeMachine = async (reqBody) => {
    try {
      let machineToRemove = await MachineList.destroy({
        where: { id: reqBody.id },
      });
      return machineToRemove;
    } catch (error) {
      throw new Error(error);
    }
  };
  let getInventoryComments = async (inventory_id, db) => {
    try {
      let inventory_comments = await db.InventoryCommentsModel.findAll({
        where: { inventory_id: inventory_id },
      });
      let userProfileData = [];
      inventory_comments.forEach(async (comments) => {
        let ProfileData = await db.UserProfile.findAll({
          where: {
            [Op.or]: [
              { id: comments.updated_by_user_id },
              { id: comments.assign_unassign_user_id },
            ],
          },
        });
        userProfileData.push(ProfileData);
      });
      const Result = [];
      Result.comments = inventory_comments;
      Result.userProfileData = userProfileData;
      return Result;
    } catch (error) {
      console.log(error);
      throw new Error("error in  getInventoryComments");
    }
  };

  const updateInventoryWithTempFile = async (
    loggeduserid,
    machine_id,
    db,
    req
  ) => {
    const file_id = await db.InventoryTempFiles.findOne({
      where: { id: req.body.temp_inventory_photo_id },
    });
    await updateInventoryFilePhoto(loggeduserid, machine_id, file_id, db, req);
  };
  const updateInventoryFilePhoto = async (
    loggeduserid,
    machine_id,
    file_id,
    db,
    req
  ) => {
    await db.MachineList.update(
      { file_inventory_photo: file_id },
      { where: { id: machine_id } }
    );
    await addInventoryComment(machine_id, loggeduserid, db, req);
  };
  const removeMachineAssignToUser = async (machine_id, loggeduserid, req) => {
    const machine_Info = await getMachineDetail(machine_id);
    if (machine_Info != null) {
      const message = [];
      message.inventoryName = machine_Info.machine_name;
      message.invetoryType = machine_Info.machine_type;
      addInventoryComment(machine_id, loggeduserid, req, db);
    }
    await db.MachineUser.destroy({ where: { machine_id: machine_id } });
    return message;
  };

  return MachineList;
}
module.exports = machinelist;
