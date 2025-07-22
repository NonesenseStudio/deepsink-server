import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { DB } from "../config/db.config";
import { users, user_models } from "../schema/user.schema";
import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { generateUuid } from "../utils";

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
        id: generateUuid(),
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
app.post("/login", async (c) => {
  const db = DB(c.env);
  try {
    // 1. 获取请求数据
    const { username, password } = await c.req.json();

    // 2. 验证输入数据
    if (!username || !password) {
      return c.json({ error: "用户名和密码不能为空" }, 400);
    }

    // 3. 检查用户名是否存在
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user) {
      return c.json({ error: "用户名不存在" }, 401);
    }
    // 4. 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return c.json({ error: "密码错误" }, 401);
    }

    // 5. 生成token
    // 生成access token (1小时有效期)
    const accessToken = jwt.sign({ userId: user.id }, "secret key", {
      expiresIn: "1h",
    });

    // 生成refresh token (7天有效期)
    const refreshToken = jwt.sign({ userId: user.id }, "refresh secret", {
      expiresIn: "7d",
    });
    // 更新用户表中的refresh_token
    await db
      .update(users)
      .set({ refresh_token: refreshToken })
      .where(eq(users.id, user.id));
    // 6. 返回响应（排除密码字段）
    const { password: _, refresh_token, role, ...safeUser } = user;
    return c.json(
      {
        message: "登录成功",
        user: safeUser,
        role: role,
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      200,
    );
  } catch (error) {
    console.error("登录失败:", error);
    return c.json({ error: "服务器内部错误" }, 500);
  }
});

//刷新令牌
app.post("/refresh", async (c) => {
  const db = DB(c.env);
  try {
    const { refresh_token } = await c.req.json();

    if (!refresh_token) {
      return c.json({ error: "缺少刷新令牌" }, 400);
    }

    // 验证refresh token
    const decoded: any = jwt.verify(refresh_token, "refresh secret");
    const userId = decoded.userId;

    // 检查用户和令牌有效性
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.refresh_token, refresh_token)))
      .get();

    if (!user) {
      return c.json({ error: "无效的刷新令牌" }, 400);
    }

    // 生成新的access token
    const newAccessToken = jwt.sign({ userId }, "secret key", {
      expiresIn: "1h",
    });

    return c.json(
      {
        access_token: newAccessToken,
        // refresh_token: newRefreshToken,
      },
      200,
    );
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return c.json({ error: "刷新令牌已过期" }, 401);
    }
    console.error("刷新令牌失败:", error);
    return c.json({ error: "无效的刷新令牌" }, 400);
  }
});

//登出
app.post("/logout", async (c) => {
  const db = DB(c.env);
  try {
    const { refresh_token } = await c.req.json();
    if (!refresh_token) {
      return c.json({ error: "缺少刷新令牌" }, 400);
    }

    // 验证并解码refresh token
    const decoded: any = jwt.verify(refresh_token, "refresh secret");
    const userId = decoded.userId;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();
    // 清除数据库中的refresh token
    if (user.role === "guest") {
      await db.delete(users).where(eq(users.id, userId));
    } else {
      await db
        .update(users)
        .set({ refresh_token: null })
        .where(eq(users.id, userId));
    }
    return c.json({ message: "登出成功" }, 200);
  } catch (error) {
    console.error("登出失败:", error);
    // 即使验证失败也返回成功，避免泄露信息
    return c.json({ message: "登出成功" }, 200);
  }
});

// 游客登录接口
app.post("/guest-login", async (c) => {
  const db = DB(c.env);
  try {
    // 生成一个临时用户名和密码
    const guestUsername = `guest_${generateUuid()}`;
    const guestPassword = generateUuid();

    // 安全处理密码（使用BCrypt哈希）
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(guestPassword, saltRounds);

    // 创建新用户
    const newUser = await db
      .insert(users)
      .values({
        id: "guest-" + generateUuid(),
        role: "guest",
        username: guestUsername,
        password: hashedPassword, // 存储哈希后的密码
      })
      .returning()
      .get();

    const newModel = await db
      .insert(user_models)
      .values({
        userId: newUser.id,
        modelId: "2428a62f5427bdc7",
      })
      .returning();

    // 生成token
    // 生成access token (1小时有效期)
    const accessToken = jwt.sign({ userId: newUser.id }, "secret key", {
      expiresIn: "1h",
    });

    // 生成refresh token (7天有效期)
    const refreshToken = jwt.sign({ userId: newUser.id }, "refresh secret", {
      expiresIn: "7d",
    });
    // 更新用户表中的refresh_token
    await db
      .update(users)
      .set({ refresh_token: refreshToken })
      .where(eq(users.id, newUser.id));

    // 返回响应（排除密码字段）
    const { password: _, refresh_token, ...safeUser } = newUser;
    return c.json(
      {
        message: "游客登录成功",
        user: safeUser,
        role: "guest",
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      201,
    );
  } catch (error) {
    console.error("游客登录失败:", error);
    return c.json({ error: "服务器内部错误" }, 500);
  }
});
// 导出路由
export default app;
