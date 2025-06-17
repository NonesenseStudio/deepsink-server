import express from "express";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth.routes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";

const app = express();
// 配置中间件
app.use(bodyParser.json());

//配置swagger
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
//注册接口
app.use("/api/auth", authRoutes);

// 同步 Sequelize 模型
export default app;
