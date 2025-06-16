import app from "./app";
import * as process from "node:process";

const PORT = process.env.Port || 3000;

app.listen(PORT, () => {
  console.log(`🌐Network: http://localhost:${PORT}`);
  console.log(`📃Documentation: http://localhost:${PORT}/docs`);
});
