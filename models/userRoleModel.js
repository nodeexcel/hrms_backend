function UserRole(database, type) {
  const userRole = database.define(
    "user_roles",
    {
      user_id: type.INTEGER,
      role_id: type.INTEGER,
    },
    {
      timestamps: false,
    }
  );
  return userRole;
}

module.exports = UserRole;
