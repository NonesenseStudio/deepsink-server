import { sequelize, Sequelize } from "@/config/db.config";

const UserConfig = sequelize.define("user", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

UserConfig.sync().then(() => {
  console.log("User table created successfully");
});

export default UserConfig;
