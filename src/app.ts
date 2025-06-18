import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import authRoutes from "./routes/auth.routes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";

const app = new Hono();
// 配置中间件
app.use("*", cors());
app.use("*", logger());

//配置swagger
// app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
//注册接口
app.get("/", (c) => c.text("Hono API"));
app.route("/api/auth", authRoutes);
app.get("/api/test", async () => {
  return new Response("hello world");
});
// 同步 Sequelize 模型
export default app;
