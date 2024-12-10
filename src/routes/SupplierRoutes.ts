import { Router } from "express";
import { body } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/authenticate";
import { SupplierController } from "../controllers/SupplierController";

const router = Router();

// ---- POST ---- //
router.post(
    "/create-supplier",
    authenticate,
    body("name")
        .notEmpty()
        .withMessage("El Nombre del Proveedor es Obligatorio"),
    body("address")
        .notEmpty()
        .withMessage("La Direccion del Proveedor es Obligatoria"),
    body("phone")
        .notEmpty()
        .withMessage("El Telefono del Proveedor es Obligatorio"),
    body("email")
        .notEmpty()
        .withMessage("El Email del Proveedor es Obligatorio"),
    handleInputErrors,
    SupplierController.createSupplier
);
router.post(
    "/edit-supplier",
    authenticate,
    body("idSupplier")
        .notEmpty()
        .withMessage("El ID del Proveedor es Obligatorio"),
    body("newName")
        .notEmpty()
        .withMessage("El Nombre del Proveedor es Obligatorio"),
    body("newAddress")
        .notEmpty()
        .withMessage("La Direccion del Proveedor es Obligatoria"),
    body("newPhone")
        .notEmpty()
        .withMessage("El Telefono del Proveedor es Obligatorio"),
    body("newEmail")
        .notEmpty()
        .withMessage("El Email del Proveedor es Obligatorio"),
    handleInputErrors,
    SupplierController.editSupplier
);
router.post(
    "/delete-supplier",
    authenticate,
    body("idSupplier")
        .notEmpty()
        .withMessage("El ID del Proveedor es Obligatorio"),
    handleInputErrors,
    SupplierController.deleteSupplier
);
router.post(
    "/active-supplier",
    authenticate,
    body("idSupplier")
        .notEmpty()
        .withMessage("El ID del Proveedor es Obligatorio"),
    handleInputErrors,
    SupplierController.activeSupplier
);
// ---- POST ---- //

// ---- GET ---- //
router.get("/suppliers", authenticate, SupplierController.getAllSuppliers);
router.get(
    "/supplier/:idSupplier",
    authenticate,
    SupplierController.getSupplier
);
// ---- GET ---- //

export default router;
