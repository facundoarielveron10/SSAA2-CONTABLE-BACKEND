import { Router } from "express";
import { StatisticsController } from "../controllers/StatisticsController";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// ---- GET ---- //
router.get("/stats", authenticate, StatisticsController.getStats);
// ---- GET ---- //

export default router;
