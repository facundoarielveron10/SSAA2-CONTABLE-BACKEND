import { Router } from "express";
import { body } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/authenticate";
import { StockController } from "../controllers/StockController";

const router = Router();

// ---- POST ---- //
// ---- POST ---- //

// ---- GET ---- //
router.get("/stock/:idArticle", authenticate, StockController.getStock);
// ---- GET ---- //

export default router;
