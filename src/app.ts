import express from "express";
import bodyParser from "body-parser";
import { sequelize } from "./config/db.config";
import authRoutes from "./routes/auth.routes";

const app = express();
// 配置中间件
app.use(bodyParser.json());

//注册接口
app.use("/api/auth", authRoutes);

// 同步 Sequelize 模型
sequelize.sync().then(() => {});
export default app;
