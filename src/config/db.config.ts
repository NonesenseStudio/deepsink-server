import { Sequelize } from "sequelize";

const sequelize = new Sequelize("deep_sink", "root", "root", {
  host: "localhost",
  dialect: "mysql",
  port: 3306,
});

sequelize
  .authenticate()
  .then(() => {
    console.log("连接成功");
  })
  .catch((err) => {
    console.error("连接失败", err);
  });

export { sequelize, Sequelize };
