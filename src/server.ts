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
import SupplierRoutes from "./routes/SupplierRoutes";
import ArticleRoutes from "./routes/ArticleRoutes";
import StockRoutes from "./routes/StockRoutes";
import PurchasingRoutes from "./routes/PurchasingRoutes";
import OrderRoutes from "./routes/OrderRoutes";

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
app.use("/api/supplier", SupplierRoutes);
app.use("/api/article", ArticleRoutes);
app.use("/api/stock", StockRoutes);
app.use("/api/purchasing", PurchasingRoutes);
app.use("/api/order", OrderRoutes);

export default app;
