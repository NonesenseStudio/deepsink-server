import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./core.schema";

export const users = sqliteTable("users", {
  ...baseColumns,
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // 存储bcrypt哈希值
});
