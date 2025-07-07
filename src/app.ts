import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRoute from "./routes/auth.route";
import modelRoute from "./routes/model.route";
import sessionRoute from "./routes/session.route";
import chatRoute from "./routes/chat.route";
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
app.route("/auth", authRoute);
app.route("/models", modelRoute);
app.route("/sessions", sessionRoute);
app.route("/chat", chatRoute);
app.get("/test", async () => {
  return new Response("hello world");
});
// 同步 Sequelize 模型
export default app;
