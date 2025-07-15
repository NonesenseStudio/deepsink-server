import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { users } from "./user.schema"; // 假设用户表的定义在users文件中
import { baseColumns } from "./core.schema";

export const providers = sqliteTable("provider", {
  ...baseColumns,
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("provider_name").notNull(),
  baseUrl: text("base_url").notNull(),
  apiKey: text("api_key").notNull(),
});

export const models = sqliteTable("models", {
  ...baseColumns,
  title: text("title").notNull(),
  modelName: text("model_name").notNull(),
  modelCode: text("model_code").notNull(),
  providerId: text("provider_id").references(() => providers.id, {
    onDelete: "cascade",
  }),
  capability: text("capability", {
    enum: ["TG", "OMNI", "RE", "IG", "IU", "VG"],
  }).notNull(),
  apiKey: text("api_key"),
  baseUrl: text("base_url"),
  stream: integer("stream").default(0),
  disabled: integer().default(0), // 0表示启用，1表示禁用
});
