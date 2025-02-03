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
router.post(
    "/delete-article",
    authenticate,
    body("idArticle")
        .notEmpty()
        .withMessage("El ID del Articulo es Obligatorio"),
    handleInputErrors,
    ArticleController.deleteArticle
);
router.post(
    "/active-article",
    authenticate,
    body("idArticle")
        .notEmpty()
        .withMessage("El ID del Articulo es Obligatorio"),
    handleInputErrors,
    ArticleController.activeArticle
);
router.post(
    "/edit-article",
    authenticate,
    body("idArticle")
        .notEmpty()
        .withMessage("El ID del Articulo es Obligatorio"),
    body("newName")
        .notEmpty()
        .withMessage("El Nombre del Articulo es Obligatorio"),
    body("newDescription")
        .notEmpty()
        .withMessage("La Descricion del Articulo es Obligatorio"),
    body("newPrice")
        .notEmpty()
        .withMessage("El Precio del Articulo es Obligatorio"),
    body("newCategories")
        .notEmpty()
        .isArray()
        .withMessage("Las Categorias del Articulo son Obligatorias"),
    body("newSuppliers")
        .notEmpty()
        .isArray()
        .withMessage("Los Proveedores del Articulo son Obligatorios"),
    handleInputErrors,
    ArticleController.editArticle
);
// ---- POST ---- //

// ---- GET ---- //
router.get("/articles", authenticate, ArticleController.getAllArticles);
router.get("/article/:idArticle", authenticate, ArticleController.getArticle);
// ---- GET ---- //

export default router;
