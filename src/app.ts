import express from "express";
import bodyParser from "body-parser";
import { Sequelize } from "sequelize";
import jwt from "jsonwebtoken";
import main from "@/routes/main.ts";
import "@/config/db.config";

const app = express();
app.use("/api", main);
require("@/config/modules/user.config");
app.listen(3000);
export default app;
