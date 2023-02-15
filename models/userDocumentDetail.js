const { Op, QueryTypes } = require("sequelize");
const Sequelize = require("sequelize");
function user_document_detail(database, type) {
  const user_document_detail = database.define(
    "user_document_detail",
    {
      user_id: type.INTEGER,
      document_type: type.STRING,
      link_1: type.STRING,
      read_status: type.INTEGER,

      last_modified: {
        type: "TIMESTAMP",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );
  return user_document_detail;
}
module.exports = user_document_detail;
