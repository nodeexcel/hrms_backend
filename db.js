const Sequelize = require("sequelize");
const databaseUri = require("./config");
const Models = require("./models/index");
const Op = Sequelize.Op;
const db = {};

// const sequelize = new Sequelize(databaseUri.psql_url,{logging: false});


const sequelize = new Sequelize('excellen_hr_test', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql',
},{logging: false});


Object.keys(Models).forEach((modelName) => {
  const model = Models[modelName](sequelize, Sequelize.DataTypes);
  db[modelName] = model;
  console.log(`Loading model - ${modelName}`);
});

Object.keys(db).forEach((modelName) => {
  try {
    if ("associate" in db[modelName]) {
      console.log(db[modelName]);
      db[modelName].associate(db);
    }
  } catch (error) {
    console.log(error);
  }
});

sequelize.authenticate();
// try {
//   sequelize.sync({ alter: true });
//   console.log("created");
// } catch (error) {
//   console.log(error);
// }

module.exports = Object.assign({}, db, {
  sequelize,
  Sequelize,
});
