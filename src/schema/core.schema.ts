import { text, integer } from "drizzle-orm/sqlite-core";
import { generateUuid } from "../utils";
import { sql } from "drizzle-orm";

export const baseColumns = {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUuid()) // 自动注入短UUID
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
};
