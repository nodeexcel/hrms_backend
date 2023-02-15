function loginToken(database, type) {
  const LoginToken = database.define(
    "login_tokens",
    {
      userid: type.INTEGER,
      token: type.STRING(3000),
      creation_timestamp: type.STRING,
      creation_date_time: type.STRING,
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );
  return LoginToken;
}

module.exports = loginToken;