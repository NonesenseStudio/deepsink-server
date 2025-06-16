import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("deep_sink", "root", "root", {
  host: "localhost",
  dialect: "mysql",
  port: 3306,
});
