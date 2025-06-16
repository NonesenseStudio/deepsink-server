import app from "./app";
import * as process from "node:process";

const PORT = process.env.Port || 3000;

app.listen(PORT, () => {
  console.log(`服务器正在运行在 http://localhost:${PORT}`);
});
