import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { body } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { OrderController } from "../controllers/OrderController";

const router = Router();

// ---- POST ---- //
router.post(
    "/create-order",
    authenticate,
    body("orders")
        .notEmpty()
        .isArray()
        .withMessage("Las ordenes de compras son obligatorias"),
    body("request")
        .notEmpty()
        .isArray()
        .withMessage("Los pedidos de compras son obligatorios"),
    handleInputErrors,
    OrderController.createOrder
);

router.post(
    "/completed-order",
    authenticate,
    body("idOrder").notEmpty().withMessage("La orden es obligatoria"),
    handleInputErrors,
    OrderController.completedOrder
);
// ---- POST ---- //

export default router;
