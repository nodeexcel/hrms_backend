const {
  copyExistingRoleRightsToNewRole,
  assignDefaultValuesToRole,
  getEnabledUsersListWithoutPass,
  getSystemDefaultRoles,
  addPagesActions,
  removePageActions
} = require("../allFunctions");
const { getAllPages, getAllActions, getAllNotifications } = require("../roles");
const {
  getRolePages,
  getRoleActions,
  getAllRole,
  assignAdminRoleToUserTypeAdminIfNoRoleAssigned,
} = require("../allFunctions");
const { QueryTypes } = require("sequelize");
function roles(database, type) {
  const roles = database.define(
    "roles",
    {
      name: type.STRING,
      description: type.STRING,
      last_update: type.DATE,
    },
    {
      timestamps: false,
    }
  );

  roles.AddNewRole = async (
    name,
    description,
    base_role_id = false,
    models
  ) => {
    try {
      let error = 1;
      let message;
      let q = await models.sequelize.query(
        `select * from roles where roles.name = '${name}'`,
        { type: QueryTypes.SELECT }
      );
      if (q.length == 0) {
        let creation = await roles.create({
          name: name,
          description: description,
        });
        error = 0;
        message = "New role added";
        if (base_role_id != null) {
          for (let key in q) {
            if (q.length != null && typeof q[key].id != "undefined") {
              let qId = q[key].id;
              await copyExistingRoleRightsToNewRole(base_role_id, qId);
            }
          }
        } else {
          for (let key in q) {
            if (q.length != null && typeof q[key].id != "undefined") {
              let qId = q[key].id;
              await assignDefaultValuesToRole(qId, name);
            }
          }
        }
      } else {
        error = 1;
        message = "Role name already exist";
      }
      let arr = {};
      arr.error = error;
      arr.message = message;
      return arr;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  };

  roles.listAllRole = async (models) => {
    try {
      let result = {};
      let allpages = await getAllPages();

      let allactions = await getAllActions();

      // let allnotifications = await getAllNotifications();
      result.default_pages = allpages;
      result.default_actions = allactions;
      // result.default_notifications = allnotifications;
      let array = await getAllRole(models);
      let array2 = [];
      if (array.length > 0) {
        await assignAdminRoleToUserTypeAdminIfNoRoleAssigned(array, models);
        for (let val of array) {
          let role_page = await getRolePages(val.id, models);
          let role_action = await getRoleActions(val.id, models);
          // let role_notify = await getRoleNotifications(array[key].id);
          for (let v1 of allpages) {
            let p = 0;
            if (!role_page) {
            } else {
              for (let u1 of role_page) {
                if (u1.page_id == v1.id) {
                  p = 1;
                }
              }
              v1["is_assigned"] = p;
            }
            let updatedActionsList = [];
            if (typeof v1.actions_list != "undefined") {
              updatedActionsList = v1.actions_list;
              for (let [key, ual] of Object.entries(updatedActionsList)) {
                let is_assigned = 0;
                for (let u2 of role_action) {
                  if (u2.action_id == ual.id) {
                    is_assigned = 1;
                  }
                }
                ual.is_assigned = is_assigned;
                updatedActionsList[key] = ual;
              }
            }
            v1.actions_list = updatedActionsList;
            val["role_pages"] = [];
            val["role_pages"] = v1;
          }
          for (let v2 of allactions) {
            let p = 0;
            for (let u2 of role_action) {
              if (u2.action_id == v2.id) {
                p1 = 1;
              }
            }
            v2.is_assigned = p;
          }
          result.users_list = await getEnabledUsersListWithoutPass(models);
          if (typeof result[roles] != "undefined" && result[roles] > 0) {
            let systemDefaultRolesList = await getSystemDefaultRoles();
            let unsortedRoles = result[roles];
            for (let [key, role] of Object.entries(unsortedRoles)) {
              unsortedRoles[key].sortOrder = 999;
              for (let dr of systemDefaultRolesList) {
                if (role.name == dr.name) {
                  unsortedRoles[key].sortOrder = dr.sortOrder;
                  unsortedRoles[key].is_system_default_role = true;
                }
              }
            }
            unsortedRoles.sort();
            result.roles = unsortedRoles;
          }
        }
      }
      let Return = {
        error: 0,
        data: result,
      };

      return Return;
    } catch (error) {
      console.log(error)
      throw new Error(error);
    }
  };

  roles.updateRole = async (reqBody, models) => {
    try {
      let error = 1;
      let message;
      let table;
      let search;
      let role = reqBody.role_id;
      let q;
      if (typeof reqBody.page_id !== "undefined" && reqBody.page_id !== "") {
        table = "roles_pages";
        search = "page_id";
        pid = reqBody.page_id;
      }
      if (
        typeof reqBody.action_id !== "undefined" &&
        reqBody.action_id !== ""
      ) {
        table = "roles_actions";
        search = "action_id";
        pid = reqBody.action_id;
      }
      // if (typeof reqBody.notification_id !== "undefined" && reqBody.notification_id !== "") {
      //   table = "roles_notifications";
      //   search = "notification_id";
      //   pid = reqBody[notification_id];
      // }
      if (table !== null) {
        q = models.sequelize.query(
          `SELECT * FROM ${table} WHERE role_id = ${role} AND ${search} = ${pid}`,
          { type: QueryTypes.SELECT }
        );
        if (q.length == 0) {
          let newQuery = models.sequelize.query(
            `insert into ${table} (role_id, ${search}) values (${role}, ${pid})`,
            { type: QueryTypes.INSERT }
          );
          if (table == "roles_pages") {
            await addPagesActions(role, pid, models);
          }
          error = 0;
          message = "Role updated!";
        } else {
          q = models.sequelize.query(
            `DELETE FROM ${table} WHERE role_id = ${role} AND ${search} = ${pid}`,
            { type: QueryTypes.DELETE }
          );
          if (table == "roles_pages") {
            await removePageActions(role, pid, models);
          }
          error = 0;
          message = "Role updated!";
        }
      } else {
        message = "Empty Data passed";
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

  roles.getListOfRoles = async () => {
    try {
      let list = await roles.findAll({});
      return list;
    } catch (error) {
      throw new Error(error);
    }
  };

  return roles;
}

module.exports = roles;
