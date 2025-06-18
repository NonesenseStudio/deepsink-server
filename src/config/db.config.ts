import { drizzle } from "drizzle-orm/d1";

export interface Env {
  DB: D1Database;
}

export function DB(env: Env) {
  return drizzle(env.DB);
}
