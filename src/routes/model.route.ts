import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { DB, Env } from "../config/db.config";
import { models } from "../schema/model.schema";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { tokenMiddleware } from "../config/auth.config";
import { generateUuid } from "../utils";

type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>();

// 使用token验证中间件
app.use("*", tokenMiddleware);

// 获取所有模型
app.get("/all", async (c: any) => {
  const db = DB(c.env);
  const userId = c.user?.userId;
  const allModels = await db
    .select()
    .from(models)
    .where(eq(models.user_id, userId));
  return c.json(allModels);
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
    const modelName = keyword;
    // 构建查询条件
    const conditions = [eq(models.user_id, userId)];
    if (modelName) {
      conditions.push(eq(models.model_name, modelName));
    }
    // 查询模型总数
    const totalModels = await db
      .select({ count: count() })
      .from(models)
      .where(and(...conditions));
    const total = totalModels[0].count;
    // 查询当前页的模型数据
    const validSortOrders = new Set(["asc", "desc"]);
    if (!validSortOrders.has(sortOrder)) {
      sortOrder = "desc"; // 默认降序
    }
    const allModels = await db
      .select()
      .from(models)
      .where(and(...conditions))
      .orderBy(sql`${models[sortBy]} ${sql.raw(sortOrder)}`)

      .offset(offset)
      .limit(pageSize);
    // 计算总页数
    // const totalPages = Math.ceil(total / pageSize);

    // 构建返回结果
    const result = {
      data: allModels,
      total,
      page,
      pageSize,
    };

    return c.json(result);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});
// 获取单个模型
app.get("/:id", async (c) => {
  const db = DB(c.env);
  const id = c.req.param("id");
  const model = await db.select().from(models).where(eq(models.id, id));
  if (model.length === 0) {
    return c.json({ error: "Model not found" }, 404);
  }
  return c.json({ data: model[0] });
});

// 创建模型
app.post("/create", async (c: any) => {
  const db = DB(c.env);
  try {
    const body = await c.req.json();
    const userId = c.user?.userId;
    const newModel = await db
      .insert(models)
      .values({
        id: generateUuid(),
        created_at: new Date(),
        user_id: userId,
        ...body,
      })
      .returning();
    return c.json(newModel[0], 201);
  } catch (error) {
    console.error("创建失败:", error);
    return c.json({ error: error.message }, 500);
  }
});

// 更新模型
app.put("/update/:id", async (c) => {
  const db = DB(c.env);
  const id = c.req.param("id");
  const body = await c.req.json();
  delete body.created_at;
  const updatedModel = await db
    .update(models)
    .set(body)
    .where(eq(models.id, id))
    .returning();
  if (updatedModel.length === 0) {
    return c.json({ error: "Model not found" }, 404);
  }
  return c.json(updatedModel[0]);
});

// 删除模型
app.delete("/delete/:id", async (c) => {
  const db = DB(c.env);
  const id = c.req.param("id");
  const deletedModel = await db
    .delete(models)
    .where(eq(models.id, id))
    .returning();
  if (deletedModel.length === 0) {
    return c.json({ error: "Model not found" }, 404);
  }
  return c.json(deletedModel[0]);
});

// 导出路由
export default app;
