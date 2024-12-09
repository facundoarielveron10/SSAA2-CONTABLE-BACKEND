import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { CategoryController } from "../controllers/CategoryController";
import { body } from "express-validator";
import { handleInputErrors } from "../middleware/validation";

const router = Router();

// ---- POST ---- //
router.post(
    "/create-category",
    authenticate,
    body("name")
        .notEmpty()
        .withMessage("El Nombre de la Categoria es Obligatorio"),
    body("description")
        .notEmpty()
        .withMessage("La Descricion de la Categoria es Obligatoria"),
    handleInputErrors,
    CategoryController.createCategory
);
router.post(
    "/edit-category",
    authenticate,
    body("idCategory")
        .notEmpty()
        .withMessage("El ID de la Categoria es Obligatorio"),
    body("newName").notEmpty().withMessage("El Nombre del Rol es Obligatorio"),
    body("newDescription")
        .notEmpty()
        .withMessage("La Descricion de la Categoria es Obligatoria"),
    handleInputErrors,
    CategoryController.editCategory
);
// ---- POST ---- //

// ---- GET ---- //
router.get("/categories", authenticate, CategoryController.getAllCategories);
router.get(
    "/category/:idCategory",
    authenticate,
    CategoryController.getCategory
);
// ---- GET ---- //

export default router;
