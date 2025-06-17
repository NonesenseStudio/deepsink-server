import app from "./app";

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🌐Network: http://localhost:${PORT}`);
  console.log(`📃Documentation: http://localhost:${PORT}/docs`);
});
export default {};