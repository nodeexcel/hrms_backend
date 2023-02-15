function machineuser(database, type) {
  const machines_user = database.define(
    "machines_user",
    {
      machine_id: type.INTEGER,
      user_Id: type.INTEGER,
      assign_date: type.DATE,
      updated_at: type.DATE,
      updated_by_userid: type.INTEGER,
    },
    {
      timestamps: false,
      freezeTableName: true,
    }
  );
  machineuser.associate = (models) => {
    models.machineuser.hasOne(models.User, {
      foreignKey: "updated_by_userid",
      as: "updated_by_user",
    });
  };

  machines_user.updateUser = async (reqBody) => {
    try {
      let creation = await machines_user.updateOne(
        {
          user_Id: reqBody.user_id,
        },
        { where: { machine_id: reqBody.machine_id } }
      );
      if (creation) {
        return creation;
      } else {
        return "machine_id not found";
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  return machines_user;
}

module.exports = machineuser;
