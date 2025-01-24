import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { body } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { ArticleController } from "../controllers/ArticleController";

const router = Router();

// ---- POST ---- //
router.post(
    "/create-article",
    authenticate,
    body("name")
        .notEmpty()
        .withMessage("El Nombre del Articulo es Obligatorio"),
    body("description")
        .notEmpty()
        .withMessage("La Descricion del Articulo es Obligatoria"),
    body("unitPrice")
        .notEmpty()
        .withMessage("El Precio del Articulo es Obligatorio"),
    body("categories")
        .notEmpty()
        .isArray()
        .withMessage("Las Categorias del Articulo son Obligatorias"),
    body("suppliers")
        .notEmpty()
        .isArray()
        .withMessage("Los Proveedores del Articulo son Obligatorios"),
    handleInputErrors,
    ArticleController.createArticle
);
// ---- POST ---- //

// ---- GET ---- //
// ---- GET ---- //

export default router;
