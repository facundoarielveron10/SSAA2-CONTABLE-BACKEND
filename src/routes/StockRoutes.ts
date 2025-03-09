import { Router } from "express";
import { body } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/authenticate";
import { StockController } from "../controllers/StockController";

const router = Router();

// ---- POST ---- //
// router.post(
//     "/create-stock",
//     authenticate,
//     body("article").notEmpty().withMessage("El Articulo es obligatorio"),
//     body("stock").notEmpty().withMessage("El Stock es obligatorio"),
//     handleInputErrors,
//     StockController.createStock
// );
// ---- POST ---- //

// ---- GET ---- //
router.get("/stock/:idArticle", authenticate, StockController.getStock);
// ---- GET ---- //

export default router;
