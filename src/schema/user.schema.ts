import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./core.schema";
import { models } from "./model.schema";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  ...baseColumns,
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // 存储bcrypt哈希值
  refresh_token: text("refresh_token"),
  role: text("role", { enum: ["user", "admin", "guest"] }).default("user"),
});

export const user_models = sqliteTable("user_models", {
  ...baseColumns,
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  modelId: text("model_id")
    .notNull()
    .references(() => models.id),
});
