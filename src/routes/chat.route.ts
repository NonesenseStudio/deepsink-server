import { Hono } from "hono";
import OpenAI from "openai";
import { DB } from "../config/db.config";
import { tokenMiddleware } from "../config/auth.config";
import { messages, sessions } from "../schema/chat.schema";
import { user_models } from "../schema/user.schema";
import { eq, sql } from "drizzle-orm";
import { models, providers } from "../schema/model.schema";
import { generateUuid } from "../utils";
import { getSessionTitle } from "../config/chat.config";
import { stream, streamText } from "hono/streaming";

type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", tokenMiddleware);

export const createChat = async (model: any, messages: any, configs?: any) => {
  const openai = new OpenAI({
    baseURL: model.baseUrl,
    apiKey: model.apiKey,
  });

  if (model.stream) {
    // 使用流式API
    return openai.chat.completions.create({
      messages,
      model: model.modelName,
      ...configs,
      stream: true,
      stream_options: {
        include_usage: true,
      },
    });
  } else {
    // 使用普通API
    return await openai.chat.completions
      .create({
        messages,
        model: model.modelName,
        ...configs,
      })
      .then((res: any) => res);
  }
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
    await db.insert(sessions).values({
      id: String(sessionId),
      userId,
      title: "",
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

  const provider: any = await db
    .select()
    .from(providers)
    .where(eq(providers.id, model[0].providerId))
    .limit(1);
  if (!model[0].apiKey) {
    model[0].apiKey = provider[0].apiKey;
  }
  if (!model[0].baseUrl) {
    model[0].baseUrl = provider[0].baseUrl;
  }
  // 调用API
  const completion = await createChat(model[0], [
    { role: "system", content: "You are a helpful assistant." },
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role, content },
  ]);
  if (model[0].stream) {
    // 处理流式响应
    // c.header('Content-Encoding', 'Identity')
    return streamText(c, async (s) => {
      let content = "";
      let newSessionItem = {};
      let messageId = "";
      for await (const chunk of completion) {
        content += chunk.choices[0]?.delta?.content || "";
        if (newSession) {
          chunk["sessionId"] = sessionId;
          if (chunk.choices[0]?.finish_reason === "stop") {
            title = await getSessionTitle(`[
            {
              role: "user",
              content: ${content},
            },
            {
              role: "assistant",
              content: ${content},
            },
          ]`);
            newSessionItem["title"] = title;
            chunk["title"] = title;
          }
        }
        if (chunk.choices[0]?.finish_reason === "stop") {
          messageId = chunk.id;
        }
        await s.write(chunk.choices[0]?.delta?.content || ""); // 逐块发送增量内容
      }
      // 更新会话时间
      await db
        .update(sessions)
        .set({ ...newSessionItem, updatedAt: new Date().valueOf() })
        .where(eq(sessions.id, sessionId));
      const assistantMessage: any = {
        id: messageId,
        sessionId,
        role: "assistant",
        content,
        model: model[0].modelCode,
        createdAt: new Date().valueOf(),
        updatedAt: new Date().valueOf(),
      };
      await db.insert(messages).values(assistantMessage);
    });
  } else {
    const aiResponse = completion.choices[0].message.content;
    // 保存AI回复
    const assistantMessage: any = {
      id: completion.id,
      sessionId,
      role: "assistant",
      content: aiResponse,
      model: model[0].modelCode,
      createdAt: new Date().valueOf(),
      updatedAt: new Date().valueOf(),
    };
    await db.insert(messages).values(assistantMessage);
    let newSessionItem = {};
    if (newSession) {
      title = await getSessionTitle(`[
      {
        role: "user",
        content: ${content},
      },
      {
        role: "assistant",
        content: ${aiResponse},
      },
    ]`);
      newSessionItem["title"] = title;
    }
    // 更新会话时间
    await db
      .update(sessions)
      .set({ ...newSessionItem, updatedAt: new Date().valueOf() })
      .where(eq(sessions.id, sessionId));
    newSessionItem = newSession
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
  }
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
