const { Op, QueryTypes } = require("sequelize");
const Sequelize = require("sequelize");
function elc_stage(database, type) {
  const elc_stage = database.define(
    "elc_stage",
    {
      text: type.STRING,
      updated_at: {
        type: "TIMESTAMP",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },
    },
    {
      timestamps: false,
    }
  );
  return elc_stage;
}
module.exports = elc_stage;
