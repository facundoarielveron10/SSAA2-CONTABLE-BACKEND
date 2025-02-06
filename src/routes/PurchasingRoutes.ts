import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { body } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { PurchasingController } from "../controllers/PurchasingController";

const router = Router();

// ---- POST ---- //
router.post(
    "/create-pucharse-request",
    authenticate,
    body("description")
        .notEmpty()
        .withMessage("La Descricion del Pedido es Obligatoria"),
    body("requiredDate")
        .notEmpty()
        .withMessage("La Fecha Requerida del Pedido es Obligatoria"),
    body("priority")
        .notEmpty()
        .withMessage("La Prioridad del Pedido es Obligatoria"),
    body("articles")
        .notEmpty()
        .isArray()
        .withMessage("La Prioridad del Pedido es Obligatoria"),
    handleInputErrors,
    PurchasingController.createPucharseRequest
);
// ---- POST ---- //

// ---- GET ---- //
// ---- GET ---- //

export default router;
