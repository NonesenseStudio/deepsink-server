import { Hono } from "hono";
import bcrypt from "bcryptjs";

// 定义环境变量类型（D1 绑定）
type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>();

app.post("/register", async (c) => {
  try {
    // 1. 解析请求体
    const { username, password } = await c.req.json();
    if (!username || !password) throw new Error("用户名和密码不能为空");

    // 2. 检查用户名是否已注册
    const existingUser = await c.env.DB.prepare(
      "SELECT username FROM users WHERE username = ?"
    ).bind(username).first();
    if (existingUser) throw new Error("用户名已被注册");

    // 3. 密码哈希（安全优化：降低 cost 适应边缘环境）
    const hashedPassword = await bcrypt.hash(password, 4); // cost=4 (默认10易超时)

    // 4. 保存到 D1 数据库
    const result = await c.env.DB.prepare(
      "INSERT INTO users (username, password) VALUES (?, ?)"
    ).bind(username, hashedPassword).run();

    return result.success
      ? c.json({ success: true }, 201)
      : c.json({ error: "数据库写入失败" }, 500);

  } catch (err) {
    // 统一错误处理
    return c.json({ error: err.message }, 400);
  }
});

export default app;