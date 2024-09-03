import { Router } from "express";
import { body } from "express-validator";
import { RoleActionController } from "../controllers/RoleActionController";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// ---- POST ---- //
router.post(
    "/create-role",
    authenticate,
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
router.get("/roles", authenticate, RoleActionController.getAllRoles);
router.get("/actions", authenticate, RoleActionController.getAllActions);
router.get("/role", authenticate, RoleActionController.getRole);
// ---- GET ---- //

export default router;
