import { Router } from "express";
import DB from "../config/db.config";
import { getPlatformProxy } from "wrangler";
import bcrypt from "bcryptjs";

const router = Router();
/**
 * @swagger
 * /users:
 *   get:
 *     summary: 获取用户列表
 *     responses:
 *       200:
 *         description: 成功返回用户数组
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/User"
 */
router.post("/register", async (req: any, res: any) => {
  const { username, password } = req.body;
  const db: any = await DB;
  // 1. 输入验证
  if (!username || !password) {
    return res.status(400).json({ error: "用户名、密码和邮箱为必填项" });
  }

  // 密码强度校验（至少8位，含大小写字母和数字）
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: "密码需至少8位，包含大小写字母和数字",
    });
  }

  try {
    // 3. 检查用户名唯一性
    const existingUser = await db
      .prepare("SELECT id FROM users WHERE username = ?")
      .bind(username)
      .first();

    if (existingUser) {
      return res.status(409).json({
        error: "用户名或邮箱已被注册",
      });
    }

    // 4. 密码加密处理
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 5. 插入新用户到数据库
    const { success, meta } = await db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .bind(username, hashedPassword)
      .run();

    // 6. 处理插入结果
    if (success) {
      res.status(201).json({
        success: true,
        userId: meta.last_row_id, // 返回新创建的用户ID[7](@ref)
      });
    } else {
      throw new Error("数据库写入失败");
    }
  } catch (error: any) {
    // 7. 统一错误处理
    console.error("注册失败:", error);
    res.status(500).json({
      error: "服务器内部错误",
      details: error.message,
    });
  }
});

export default router;
