function RolesNotificaion(database, type) {
  const rolesNotification = database.define(
    "roles_notifications",
    {
      role_id: type.INTEGER,
      notification_id: type.INTEGER,
    },
    {
      timestamps: false,
    }
  );
  rolesNotification.associate = (models) => {
    rolesNotification.hasOne(models.Role, {
      foreignKey: "role_id",
      as: "role",
    });
  };

  return rolesNotification;
}

module.exports = RolesNotificaion;
