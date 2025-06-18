import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite", // 'mysql' | 'sqlite' | 'turso'
  schema: "./src/schema/*.schema.ts",
  out: "./drizzle",
  driver: "d1-http",
  dbCredentials: {
    accountId: "73686fbc2d06ec6bad8bbfe9efe5b5e8",
    databaseId: "6da38cbb-f76a-427c-b402-f6f5232ce138",
    token: "K5ZCS3O57SgJTCCFI9H6sKVlSeys2O81e_wFXfK7",
  },
});
