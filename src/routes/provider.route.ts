import { Hono } from "hono";
import { DB, Env } from "../config/db.config";
import { providers } from "../schema/model.schema";
import { and, count, eq, sql } from "drizzle-orm";
import { tokenMiddleware } from "../config/auth.config";
import { encodeBase64 } from "bcryptjs";
type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>();

// 使用token验证中间件
app.use("*", tokenMiddleware);

// 获取所有供应商
app.get("/", async (c: any) => {
  try {
    const db = DB(c.env);
    const allProviders = await db
      .select()
      .from(providers)
      .orderBy(sql`${providers.createdAt} desc`);
    return c.json(allProviders, 200);
  } catch (error) {
    console.error("获取provider失败：", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/pages", async (c: any) => {
  const db = DB(c.env);
  const userId = c.user?.userId;
  let {
    page = 1,
    pageSize = 10,
    keyword,
    sortBy,
    sortOrder,
  } = await c.req.json();
  try {
    // 计算分页的偏移量
    const offset = (page - 1) * pageSize;
    const name = keyword;
    // 构建查询条件
    const conditions = [eq(providers.userId, userId)];
    if (name) {
      conditions.push(eq(providers.name, name));
    }
    // 查询模型总数
    const totalProvider = await db
      .select({ count: count() })
      .from(providers)
      .where(and(...conditions));
    const total = totalProvider[0].count;
    // 查询当前页的模型数据
    const validSortOrders = new Set(["asc", "desc"]);
    if (!validSortOrders.has(sortOrder)) {
      sortOrder = "desc"; // 默认降序
    }
    const allProvider = await db
      .select()
      .from(providers)
      .where(and(...conditions))
      .orderBy(sql`${providers[sortBy]} ${sql.raw(sortOrder)}`)

      .offset(offset)
      .limit(pageSize);
    // 计算总页数
    // const totalPages = Math.ceil(total / pageSize);

    // 构建返回结果
    const result = {
      data: allProvider,
      total,
      page,
      pageSize,
    };

    return c.json(result);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

//创建供应商
app.post("/", async (c: any) => {
  const db = DB(c.env);
  const userId = c.user?.userId;
  const { name, apiKey, baseUrl } = await c.req.json();
  try {
    const newProvider = await db
      .insert(providers)
      .values({
        name,
        apiKey: encodeBase64(apiKey, 50),
        baseUrl,
        userId,
        createdAt: new Date().valueOf(),
        updatedAt: new Date().valueOf(),
      })
      .returning();
    return c.json(newProvider, 201);
  } catch (error) {
    console.error("创建供应商失败：", error);
    return c.json({ error: error.message }, 500);
  }
});

//更新供应商
app.put("/:id", async (c: any) => {
  const db = DB(c.env);
  const userId = c.user?.userId;
  const { id } = c.req.params;
  const { name, apiKey, baseUrl } = await c.req.json();
  try {
    const updatedProvider = await db
      .update(providers)
      .set({
        name,
        apiKey,
        baseUrl,
        updatedAt: new Date().valueOf(),
      })
      .where(and(eq(providers.id, id), eq(providers.userId, userId)))
      .returning();
    return c.json(updatedProvider, 200);
  } catch (error) {
    console.error("更新供应商失败", error);
    return c.json({ error: error.message }, 500);
  }
});

//删除供应商
app.delete("/:id", async (c: any) => {
  const db = DB(c.env);
  const userId = c.user?.userId;
  const { id } = c.req.params;
  try {
    const deletedProvider = await db
      .delete(providers)
      .where(and(eq(providers.id, id), eq(providers.userId, userId)))
      .returning();
    return c.json(deletedProvider, 200);
  } catch (error) {
    console.error("删除供应商失败", error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
