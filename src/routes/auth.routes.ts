// src/routes/auth.routes.ts
import { Router } from "express";
import { registerUser } from "../controllers/auth.controller";

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
router.post("/register", async (req, res) => {
  await registerUser(req, res);
});

export default router;
