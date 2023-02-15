function RolesAction(database, type) {
  const rolesAction = database.define(
    "roles_actions",
    {
      role_id: type.INTEGER,
      action_id: type.INTEGER,
    },
    { timestamps: false }
  );
  rolesAction.associate = (models) => {
    rolesAction.hasOne(models.Role, {
      foreignKey: "role_id",
      as: "role",
    });
  };

  return rolesAction;
}

module.exports = RolesAction;
