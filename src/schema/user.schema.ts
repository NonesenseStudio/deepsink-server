import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./core.schema";
import { models } from "./model.schema";

export const users = sqliteTable("users", {
  ...baseColumns,
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // 存储bcrypt哈希值
  refresh_token: text("refresh_token"),
});

export const user_model = sqliteTable("user_model", {
  ...baseColumns,
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  model_id: text("model_id")
    .notNull()
    .references(() => models.id),
});
