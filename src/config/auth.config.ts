import jwt from "jsonwebtoken";

export function tokenMiddleware(c: any, next: any) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Token is missing" }, 401);
  }
  // 提取Bearer token
  const token = authHeader.split(" ")[1];
  if (!token) {
    return c.json({ error: "Token is missing" }, 401);
  }
  try {
    // 验证token
    // 如果验证通过，decoded将包含JWT的payload
    // 您可以在这里添加更多验证，例如检查decoded中的userId是否存在
    c.user = jwt.verify(token, "secret key");
  } catch (err) {
    // 如果验证失败，捕获错误
    return c.json({ error: "Invalid token" }, 401);
  }

  return next();
}
