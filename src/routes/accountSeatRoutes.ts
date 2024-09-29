import { Router } from "express";
import { body } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/authenticate";
import { AccountSeatController } from "../controllers/AccountSeatController";

const router = Router();

// ---- POST ---- //
router.post(
    "/create-seat",
    authenticate,
    body("accountId").notEmpty().withMessage("La Cuenta es Obligatoria"),
    body("date").isDate().notEmpty().withMessage("La Fecha es Obligatoria"),
    body("description").notEmpty().withMessage("La Descricion es Obligatoria"),
    body("debe").notEmpty().withMessage("El Debe es Obligatorio"),
    body("haber").notEmpty().withMessage("El Haber es Obligatorio"),
    handleInputErrors,
    AccountSeatController.createSeat
);
// ---- POST ---- //

// ---- GET ---- //
// ---- GET ---- //

export default router;
