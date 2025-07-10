import { Hono } from "hono";
import { DB } from "../config/db.config";
import { eq } from "drizzle-orm";
import { messages, sessions } from "../schema/chat.schema";
import { generateUuid } from "../utils";
import { tokenMiddleware } from "../config/auth.config";
import dayjs from "dayjs";

type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", tokenMiddleware);
// 创建新会话
app.post("/create", async (c: any) => {
  try {
    const db = DB(c.env);
    const userId = c.user?.userId;
    const newSession: any = {
      id: generateUuid(true),
      userId,
      title: "",
      createdAt: new Date().valueOf(),
      updatedAt: new Date().valueOf(),
    };
    const result = await db.insert(sessions).values(newSession).returning();
    return c.json(result[0], 201);
  } catch (error) {
    console.error("会话创建失败：", error);
    return c.json({ error: error.message }, 500);
  }
});
// 获取所有会话
app.get("/", async (c: any) => {
  try {
    const db = DB(c.env);
    const userId = c.user?.userId;
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "10");
    const offset = (page - 1) * pageSize;
    const allSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .offset(offset)
      .limit(pageSize);
    return c.json(allSessions, 200);
  } catch (error) {
    console.error("获取会话失败：", error);
    return c.json({ error: error.message }, 500);
  }
});

// 根据会话ID查询单个会话
app.get("/:id", async (c: any) => {
  try {
    const db = DB(c.env);
    const sessionId = c.req.param("id");
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return c.json({ error: "会话未找到" }, 404);
    }
    delete session[0].userId;
    return c.json(session[0], 200);
  } catch (error) {
    console.error("获取会话失败：", error);
    return c.json({ error: error.message }, 500);
  }
});

app.patch("/edit/:id", async (c) => {
  const db = DB(c.env);
  const id = c.req.param("id");
  const { title } = await c.req.json(); // 从请求体中获取新的标题

  try {
    // 更新 sessions 表中的会话记录的标题
    await db
      .update(sessions)
      .set({ title, updatedAt: new Date().valueOf() }) // 设置新的标题
      .where(eq(sessions.id, id));

    return c.text("Title updated", 200);
  } catch (error) {
    // 处理更新失败的情况
    console.error("更新失败: ", error);
    return c.json({ error: "修改当前会话标题错误" }, 500);
  }
});

// 删除会话
app.delete("/delete/:id", async (c) => {
  const db = DB(c.env);
  const id = c.req.param("id");
  try {
    await db.delete(sessions).where(eq(sessions.id, id));
    return c.text("Deleted", 201);
  } catch (error) {
    // 处理事务失败的情况
    console.error("删除失败: ", error);
    return c.json({ error: "删除当前会话失败" }, 500);
  }
});

export default app;
