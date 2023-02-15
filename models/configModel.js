const { responseForData } = require("../util/responseHandlers");

function config(database, type) {
  const config = database.define(
    "config",
    {
      type: type.STRING,
      value: type.STRING,
      email_id: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
    }
  );
  
  return config;
}

module.exports = config;
