// src/controllers/authController.ts
import { Request, Response } from "express";
import { User } from "../models/user.model";

export const registerUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "用户名和密码不能为空" });
  }

  try {
    const existingUser = await User.findOne({ where: { username } });

    if (existingUser) {
      return res.status(409).json({ message: "用户名已存在" });
    }

    await User.create({ username, password });
    res.status(201).json({ message: "注册成功" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};
