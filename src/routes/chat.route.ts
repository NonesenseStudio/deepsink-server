import { Hono } from "hono";
import OpenAI from "openai";
import { DB } from "../config/db.config";
import { tokenMiddleware } from "../config/auth.config";
import { messages, sessions } from "../schema/chat.schema";
import { user_models } from "../schema/user.schema";
import { eq, sql } from "drizzle-orm";
import { models } from "../schema/model.schema";
import { generateUuid } from "../utils";
import { getSessionTitle } from "../config/chat.config";

type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", tokenMiddleware);

export const createChat = async (model: any, messages: any, configs?: any) => {
  const openai = new OpenAI({
    baseURL: model.baseUrl,
    apiKey: model.apiKey,
  });
  return await openai.chat.completions
    .create({
      messages,
      model: model.modelName,
      ...configs,
    })
    .then((res: any) => res);
};
//会话
app.post("/messages", async (c: any) => {
  const db = DB(c.env);
  let { content, role = "user", sessionId } = await c.req.json();
  const userId = c.user?.userId;
  let newSession = !sessionId;
  let title = "";
  if (!sessionId) {
    //新建session
    sessionId = generateUuid(true);
    title = await getSessionTitle(content);
    await db.insert(sessions).values({
      id: String(sessionId),
      userId,
      title,
      createdAt: new Date().valueOf(),
      updatedAt: new Date().valueOf(),
    });
  }
  // 保存用户消息
  const userMessage: any = {
    id: generateUuid(),
    sessionId,
    role,
    content,
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
  };
  await db.insert(messages).values(userMessage);

  // 获取会话上下文
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(messages.createdAt);
  // 获取用户模型
  const userModel = await db
    .select()
    .from(user_models)
    .where(eq(user_models.userId, userId));
  if (!userModel) {
    return c.json({ error: "未绑定模型" }, 404);
  }
  const model: any = await db
    .select()
    .from(models)
    .where(eq(models.id, userModel[0].modelId))
    .limit(1);
  // 调用API
  const completion = await createChat(model[0], [
    { role: "system", content: "You are a helpful assistant." },
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role, content },
  ]);
  const aiResponse = completion.choices[0].message.content;
  // 保存AI回复
  const assistantMessage: any = {
    id: completion.id,
    sessionId,
    role: "assistant",
    content: aiResponse,
    model: model[0].modelName,
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
  };
  await db.insert(messages).values(assistantMessage);

  // 更新会话时间
  await db
    .update(sessions)
    .set({ updatedAt: new Date().valueOf() })
    .where(eq(sessions.id, sessionId));
  let newSessionItem = newSession
    ? {
        sessionId,
        title,
      }
    : {};
  return c.json({
    id: completion.id,
    role: completion.choices[0].message.role,
    message: aiResponse,
    ...newSessionItem,
  });
});

// 查询当前sessionId下的所有消息
app.get("/messages/:sessionId", async (c: any) => {
  try {
    const db = DB(c.env);
    const sessionId = c.req.param("sessionId");
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "10");
    const offset = (page - 1) * pageSize;

    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(sql`${messages.createdAt} desc`)
      .offset(offset)
      .limit(pageSize);

    return c.json(message, 200);
  } catch (error) {
    console.error("获取消息失败：", error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
