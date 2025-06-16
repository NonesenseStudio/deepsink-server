import express from "express";
import register from "@/routes/user/register.ts";
const main = express.Router();

main.post("/register", register);
// main.post("/login", require("./user/login"));

//导出
export default main;
