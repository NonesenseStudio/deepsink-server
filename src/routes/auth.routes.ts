// src/routes/auth.routes.ts
import { Router } from "express";
import { registerUser } from "../controllers/auth.controller";

const router = Router();

router.post("/register", async (req, res) => {
  await registerUser(req, res);
});

export default router;
