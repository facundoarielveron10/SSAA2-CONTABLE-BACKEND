import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { corsConfig } from "./config/cors";
import { connectDB } from "./config/database";
import UserRoutes from "./routes/UserRoutes";
import RoleActionRoutes from "./routes/RoleActionRoutes";
import AccountRoutes from "./routes/AccountRoutes";
import AccountSeatRoutes from "./routes/AccountSeatRoutes";
import StatisticsRoutes from "./routes/StatisticsRoutes";
import CategoryRoutes from "./routes/CategoryRoutes";

dotenv.config();

connectDB();

const app = express();

app.use(cors(corsConfig));
app.use(express.json());

// ROUTES
app.use("/api/user", UserRoutes);
app.use("/api/role-action", RoleActionRoutes);
app.use("/api/account", AccountRoutes);
app.use("/api/account-seat", AccountSeatRoutes);
app.use("/api/stats", StatisticsRoutes);
app.use("/api/category", CategoryRoutes);

export default app;
