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
    body("description").notEmpty().withMessage("La Descricion es Obligatoria"),
    body("seats")
        .isArray()
        .notEmpty()
        .withMessage("Los Asientos son obligatorios"),
    handleInputErrors,
    AccountSeatController.createSeat
);
// ---- POST ---- //

// ---- GET ---- //
router.get("/diary", authenticate, AccountSeatController.getDiary);
router.get("/seats", authenticate, AccountSeatController.getSeats);
router.get("/seat/:idSeat", authenticate, AccountSeatController.getSeat);
// ---- GET ---- //

export default router;
