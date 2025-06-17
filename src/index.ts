import { serve } from "@hono/node-server";
import app from "./app";

const PORT: number = 3000;
serve({
  fetch: app.fetch,
  port: 3000,
});

export default {
  port: 3000,
  fetch: app.fetch,
};
