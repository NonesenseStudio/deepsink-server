import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { DB } from "../config/db.config";
import { users } from "../schema/user.schema";
import { eq } from "drizzle-orm";

type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>();
app.post("/register", async (c) => {
  const db = DB(c.env);
  try {
    // 1. 获取请求数据
    const { username, password } = await c.req.json();

    // 2. 验证输入数据
    if (!username || !password) {
      return c.json({ error: "用户名和密码不能为空" }, 400);
    }
    if (password.length < 8) {
      return c.json({ error: "密码长度至少8个字符" }, 400);
    }

    // 4. 检查用户名是否已存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (existingUser) {
      return c.json({ error: "用户名已存在" }, 409);
    }

    // 5. 安全处理密码（使用BCrypt哈希）[9,10](@ref)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 6. 创建新用户
    const newUser = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword, // 存储哈希后的密码
      })
      .returning()
      .get();

    // 7. 返回响应（排除密码字段）
    const { password: _, ...safeUser } = newUser;
    return c.json(
      {
        message: "注册成功",
        user: safeUser,
      },
      201,
    );
  } catch (error) {
    console.error("注册失败:", error);
    return c.json({ error: "服务器内部错误" }, 500);
  }
});

export default app;
