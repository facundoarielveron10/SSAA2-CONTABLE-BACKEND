import { Router } from "express";
import { body } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/authenticate";
import { AccountController } from "../controllers/AccountController";

const router = Router();

// ---- POST ---- //
router.post(
    "/create-account",
    authenticate,
    body("name").notEmpty().withMessage("El Nombre es Obligatorio"),
    body("description").notEmpty().withMessage("La Descripcion es Obligatoria"),
    body("type").notEmpty().withMessage("El Tipo de Cuenta es Obligatoria"),
    handleInputErrors,
    AccountController.createAccount
);

router.post(
    "/edit-account",
    authenticate,
    body("idAccount").notEmpty().withMessage("El ID es Obligatorio"),
    body("name").notEmpty().withMessage("El Nombre es Obligatorio"),
    body("description").notEmpty().withMessage("La Descripcion es Obligatoria"),
    handleInputErrors,
    AccountController.editAccount
);
// ---- POST ---- //

// ---- GET ---- //
router.get("/accounts", authenticate, AccountController.getAllAccount);
router.get(
    "/accounts/childless",
    authenticate,
    AccountController.getAccountsChildless
);
router.get("/account/:idAccount", authenticate, AccountController.getAccount);
// ---- GET ---- //
export default router;
