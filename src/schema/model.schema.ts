import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { users } from "./user.schema"; // 假设用户表的定义在users文件中
import { baseColumns } from "./core.schema";

export const models = sqliteTable("models", {
  ...baseColumns,
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  model_name: text("model_name").notNull(),
  api_key: text("api_key").notNull(),
  base_url: text("base_url"),
  stream: integer("stream").default(0),
  disabled: integer().default(0), // 0表示启用，1表示禁用
  // modelVersion: text("model_version"),
  // maxTokens: integer("max_tokens").default(4096),
  // temperature: integer("temperature").default(0.7),
  // topP: real("top_p").default(1),
  // stop: text("stop"),
  // responseFormat: text("response_format").default(`{ "type": "text" }`),
});
