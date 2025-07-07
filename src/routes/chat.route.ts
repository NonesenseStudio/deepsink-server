import { Hono } from "hono";
import OpenAI from "openai";
import { DB } from "../config/db.config";
import { tokenMiddleware } from "../config/auth.config";
import { messages, sessions } from "../schema/chat.schema";
import { user_models } from "../schema/user.schema";
import { eq } from "drizzle-orm";
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
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: messages.role, content: messages.content },
        // ...history.map((msg) => ({
        //   role: msg.role,
        //   content: msg.content,
        // })),
      ],
      model: model.modelName,
      ...configs,
    })
    .then((res: any) => res);
};
app.post("/messages", async (c: any) => {
  const db = DB(c.env);
  let { content, role = "user", sessionId } = await c.req.json();
  console.log(await c.req.json());
  const userId = c.user?.userId;
  let newSession = !sessionId;
  if (!sessionId) {
    sessionId = generateUuid(true);
    const title = await getSessionTitle(content);
    // await db.insert(sessions).values({
    //   id: sessionId,
    //   userId,
    //   title,
    //   createdAt: new Date(),
    //   updatedAt: new Date(),
    // });
  }
  // 保存用户消息
  // const userMessage: any = {
  //   id: generateUuid(),
  //   sessionId,
  //   role,
  //   content,
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // };
  // await db.insert(messages).values(userMessage);

  // 获取会话上下文
  // const history = await db
  //   .select()
  //   .from(messages)
  //   .where(eq(messages.sessionId, sessionId))
  //   .orderBy(messages.createdAt);
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
  const completion = await createChat(model[0], { content, role });
  console.log(completion);
  const aiResponse = completion.choices[0].message.content;
  // 保存AI回复
  // const assistantMessage = {
  //   sessionId,
  //   role: "assistant",
  //   content: aiResponse,
  //   createdAt: new Date(),
  // };
  // await db.insert(messages).values(assistantMessage);

  // 更新会话时间
  // await db
  //   .update(sessions)
  //   .set({ updatedAt: new Date() })
  //   .where(eq(sessions.id, sessionId));
  return c.json({
    id: completion.id,
    sessionId,
    role: completion.choices[0].message.content,
    message: aiResponse,
  });
});

export default app;
