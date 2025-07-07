import { Hono } from "hono";
import { DB } from "../config/db.config";
import { eq } from "drizzle-orm";
import { sessions } from "../schema/chat.schema";
import { generateUuid } from "../utils";
import { tokenMiddleware } from "../config/auth.config";

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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.insert(sessions).values(newSession).returning();
    return c.json(result[0], 201);
  } catch (error) {
    console.error("会话创建失败：", error);
    return c.json({ error: error.message }, 500);
  }
});

// 删除会话
app.delete("/:id", async (c) => {
  const db = DB(c.env);
  const id = c.req.param("id");
  await db.delete(sessions).where(eq(sessions.id, id));
  return c.text("Deleted", 201);
});
export default app;
