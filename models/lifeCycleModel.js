const Sequelize = require("sequelize");
function LifeCycle(database, type) {
  const lifeCycle = database.define(
    "employee_life_cycle",
    {
      userid: type.INTEGER,
      elc_step_id: type.INTEGER,
      last_update: {
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
  return lifeCycle;
}

module.exports = LifeCycle;
