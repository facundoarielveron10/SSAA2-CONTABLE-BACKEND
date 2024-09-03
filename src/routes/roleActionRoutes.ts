import { Router } from "express";
import { body } from "express-validator";
import { RoleActionController } from "../controllers/RoleActionController";
import { handleInputErrors } from "../middleware/validation";

const router = Router();

// ---- POST ---- //
router.post(
    "/create-role",
    body("name").notEmpty().withMessage("El Nombre del Rol es Obligatorio"),
    body("nameDescriptive")
        .notEmpty()
        .withMessage("El Nombre Descriptivo del Rol es Obligatorio"),
    body("description")
        .notEmpty()
        .withMessage("La Descricion del Rol es Obligatoria"),
    body("actions")
        .isArray({ min: 1 })
        .withMessage("Las Acciones son obligatorias"),
    handleInputErrors,
    RoleActionController.createRole
);
// ---- POST ---- //

// ---- GET ---- //
router.get("/roles/:id", RoleActionController.getAllRoles);
router.get("/actions/:id", RoleActionController.getAllActions);
// ---- GET ---- //

export default router;
