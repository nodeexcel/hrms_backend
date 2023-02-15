const { Op, QueryTypes } = require("sequelize");
const Sequelize = require("sequelize");
function elc_stages_step(database, type) {
  const elc_stages_step = database.define(
    "elc_stages_step",
    {
      elc_stage_id: type.INTEGER,
      name: type.STRING,
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
  return elc_stages_step;
}
module.exports = elc_stages_step;
