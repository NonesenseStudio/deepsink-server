import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { users } from "./user.schema"; // 假设用户表的定义在users文件中
import { baseColumns } from "./core.schema";
import { models } from "./model.schema";
import { sql } from "drizzle-orm";

export const sessions = sqliteTable("sessions", {
  ...baseColumns,
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
});

export const messages = sqliteTable("messages", {
  ...baseColumns,
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(), // 消息角色
  content: text("content").notNull(), // 消息文本
  model: text("model"), // 使用的 AI 模型（如 gpt-4o）
});
