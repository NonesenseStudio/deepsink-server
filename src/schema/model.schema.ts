import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { users } from "./user.schema"; // 假设用户表的定义在users文件中
import { baseColumns } from "./core.schema";

export const models = sqliteTable("models", {
  ...baseColumns,
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  modelName: text("model_name").notNull(),
  apiKey: text("api_key").notNull(),
  baseUrl: text("base_url"),
  stream: integer("stream").default(0),
  disabled: integer().default(0), // 0表示启用，1表示禁用
  // modelVersion: text("model_version"),
  // maxTokens: integer("max_tokens").default(4096),
  // temperature: integer("temperature").default(0.7),
  // topP: real("top_p").default(1),
  // stop: text("stop"),
  // responseFormat: text("response_format").default(`{ "type": "text" }`),
});
