const {
  api_addInventoryAudit,
  refreshToken,
  isInventoryAuditPending,
} = require("../allFunctions");
function inventorycomments(database, type) {
  const inventory_comments = database.define(
    "inventory_comments",
    {
      inventory_id: type.INTEGER,
      updated_by_user_id: {
        type: type.INTEGER,
        defaultValue: false,
      },
      assign_unassign_user_id: type.INTEGER,
      comment: {
        type: type.STRING,
        defaultValue: false,
      },
      updated_at: type.DATE,
      comment_type: {
        type: type.STRING,
        defaultValue: false,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
    }
  );
  inventory_comments.associate = (models) => {
    inventory_comments.hasOne(models.MachineList, {
      foreignKey: "inventory_id",
      as: "inventory",
    });
    inventory_comments.hasOne(models.User, {
      foreignKey: "updated_by_user_id",
      as: "updated_by_user",
    });
    inventory_comments.hasOne(models.User, {
      foreignKey: "assign_unassign_user_id",
      as: "assign_unassign_user",
    });
  };

  inventory_comments.createAudit = async (req, models) => {
    try {
      let loggedUserInfo = req.userData;
      let logged_user_id = req.userData.id;
      let inventory_id = req.body.inventory_id;
      let audit_message = req.body.audit_message;
      let audit_comment_type = false;
      if (
        typeof req.body.audit_comment_type != undefined &&
        req.body.audit_comment_type != null
      ) {
        audit_comment_type = req.body.audit_comment_type;
      }
      if (audit_comment_type == "all_good") {
        audit_message = "All Good";
        if (
          typeof req.body.audit_message != undefined &&
          req.body.audit_message != null &&
          req.body.audit_message != ""
        ) {
          audit_message = req.body.audit_message;
        }
      }
      let response = await api_addInventoryAudit(
        loggedUserInfo,
        inventory_id,
        logged_user_id,
        audit_comment_type,
        audit_message,
        models,
        req
      );
      if (
        typeof req.body.do_refresh_token != "undefined" &&
        req.body.do_refresh_token == 1
      ) {
        const data = await isInventoryAuditPending(logged_user_id, models);
        if (data == false) {
          let oldToken = req.headers.authorization;
          // let newToken = await refreshToken(oldToken, models, (addOns = false));
          // response.data.new_token = newToken;
        }
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  inventory_comments.unassignRequest = async (reqBody) => {
    try {
      let requestForUnassignment = await inventory_comments.create({
        inventory_id: reqBody.inventory_id,
        comment: reqBody.comment,
      });
      return requestForUnassignment;
    } catch (error) {
      throw new Error(error);
    }
  };
  return inventory_comments;
}

module.exports = inventorycomments;
