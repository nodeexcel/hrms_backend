function inventoryauditmonthwise(database, type) {
  const inventory_audit_month_wise = database.define(
    "inventory_audit_month_wise",
    {
      inventory_id: type.INTEGER,
      month: {
        type: type.INTEGER,
        defaultValue: false,
      },
      year: {
        type: type.INTEGER,
        defaultValue: false,
      },
      audit_done_by_user_id: {
        type: type.INTEGER,
        defaultValue: false,
      },
      inventory_comment_id: {
        type: type.INTEGER,
        defaultValue: false,
      },
      updated_at: type.DATE,
    },
    {
      timestamps: false,
      freezeTableName: true,
    }
  );

  inventory_audit_month_wise.associate = (models) => {
    inventory_audit_month_wise.hasOne(models.MachineList, {
      foreignKey: "inventory_id",
      as: "inventory",
    });
    inventory_audit_month_wise.hasOne(models.User, {
      foreignKey: "audit_done_by_user_id",
      as: "audit_done_by_user",
    });
    inventory_audit_month_wise.hasOne(models.InventoryCommentsModel, {
      foreignKey: "inventory_comment_id",
      as: "inventory_comment",
    });
  };
  // inventory_audit_month_wise.getStatus = async (reqBody) => {
  //   try {
  //     let auditMonthwiseStatus = await inventory_audit_month_wise.findAll({
  //       where: { month: reqBody.month, year: reqBody.year },
  //     });
  //   return auditMonthwiseStatus;
  //   } catch (error) {
  //     throw new Error(error);
  //   }
  // };

  return inventory_audit_month_wise;
}

module.exports = inventoryauditmonthwise;
