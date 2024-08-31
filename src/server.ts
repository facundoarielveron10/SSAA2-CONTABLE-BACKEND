import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { corsConfig } from "./config/cors";
import { connectDB } from "./config/database";
import userRoutes from "./routes/userRoutes";
import roleActionRoutes from "./routes/roleActionRoutes";

dotenv.config();

connectDB();

const app = express();

app.use(cors(corsConfig));
app.use(express.json());

// ROUTES
app.use("/api/user", userRoutes);
app.use("/api/role-action", roleActionRoutes);

export default app;
