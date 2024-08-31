import { Router } from "express";
import { body, param } from "express-validator";
import { RoleActionController } from "../controllers/RoleActionController";
import { handleInputErrors } from "../middleware/validation";

const router = Router();

// ---- POST ---- //
router.post(
    "/create-role",
    body("name").notEmpty().withMessage("El Nombre del Rol es Obligatorio"),
    body("actions")
        .isArray({ min: 1 })
        .withMessage("Las Acciones son obligatorias"),
    handleInputErrors,
    RoleActionController.createRole
);
// ---- POST ---- //

export default router;
