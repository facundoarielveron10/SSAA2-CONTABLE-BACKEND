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
router.post(
    "/edit-role",
    authenticate,
    body("idRole").notEmpty().withMessage("El ID del Rol es Obligatorio"),
    body("newName").notEmpty().withMessage("El Nombre del Rol es Obligatorio"),
    body("newNameDescriptive")
        .notEmpty()
        .withMessage("El Nombre Descriptivo del Rol es Obligatorio"),
    body("newDescription")
        .notEmpty()
        .withMessage("La Descricion del Rol es Obligatoria"),
    body("newActions")
        .isArray({ min: 1 })
        .withMessage("Las Acciones son obligatorias"),
    handleInputErrors,
    RoleActionController.editRole
);
// ---- POST ---- //

// ---- GET ---- //
router.get("/roles", authenticate, RoleActionController.getAllRoles);
router.get("/actions", authenticate, RoleActionController.getAllActions);
router.get("/role/:idRole", authenticate, RoleActionController.getRoleActions);
// ---- GET ---- //

export default router;
