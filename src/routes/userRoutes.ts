import { Router } from "express";
import { body, param } from "express-validator";
import { UserController } from "../controllers/UserController";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// ---- POST ---- //
router.post(
    "/register",
    body("name").notEmpty().withMessage("El Nombre es Obligatorio"),
    body("lastname").notEmpty().withMessage("El Apellido es Obligatorio"),
    body("email").isEmail().withMessage("El Email del Usuario es Obligatorio"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("La Contraseña es muy corta, minimo 8 caracteres"),
    body("passwordConfirm").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Las Contraseñas no son iguales");
        }
        return true;
    }),
    handleInputErrors,
    UserController.createUser
);

router.post(
    "/confirm",
    body("token").notEmpty().withMessage("El Token no puede ir vacio"),
    handleInputErrors,
    UserController.confirmUser
);

router.post(
    "/login",
    body("email").isEmail().withMessage("El Email es Obligatorio"),
    body("password").notEmpty().withMessage("La Contraseña es Obligatoria"),
    handleInputErrors,
    UserController.login
);

router.post(
    "/reset-password",
    body("email").isEmail().withMessage("El Email del Usuario es Obligatorio"),
    handleInputErrors,
    UserController.resetPassword
);

router.post(
    "/validate-token",
    body("token").notEmpty().withMessage("El Token no puede ir vacio"),
    handleInputErrors,
    UserController.validateToken
);

router.post(
    "/update-password/:token",
    param("token").isNumeric().withMessage("Token no válido"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("La Contraseña es muy corta, minimo 8 caracteres"),
    body("passwordConfirm").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Las Contraseñas no son iguales");
        }
        return true;
    }),
    handleInputErrors,
    UserController.updatePassword
);

router.post(
    "/change-role",
    authenticate,
    body("role").notEmpty().withMessage("El Rol no puede ir vacio"),
    body("userId")
        .notEmpty()
        .withMessage("El ID del Usuario no puede ir vacio"),
    handleInputErrors,
    UserController.changeRole
);

router.post(
    "/create-user",
    authenticate,
    body("name").notEmpty().withMessage("El Nombre es Obligatorio"),
    body("lastname").notEmpty().withMessage("El Apellido es Obligatorio"),
    body("email").isEmail().withMessage("El Email del Usuario es Obligatorio"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("La Contraseña es muy corta, minimo 8 caracteres"),
    body("passwordConfirm").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Las Contraseñas no son iguales");
        }
        return true;
    }),
    body("role").notEmpty().withMessage("El Rol es Obligatorio"),
    handleInputErrors,
    UserController.createUserWithRole
);

router.post(
    "/edit-user",
    authenticate,
    body("name").notEmpty().withMessage("El Nombre es Obligatorio"),
    body("lastname").notEmpty().withMessage("El Apellido es Obligatorio"),
    body("email").isEmail().withMessage("El Email del Usuario es Obligatorio"),
    body("password")
        .optional({ checkFalsy: true })
        .isLength({ min: 8 })
        .withMessage("La Contraseña es muy corta, mínimo 8 caracteres"),
    body("passwordConfirm").custom((value, { req }) => {
        if (req.body.password && value !== req.body.password) {
            throw new Error("Las Contraseñas no son iguales");
        }
        return true;
    }),
    body("role").notEmpty().withMessage("El Rol es Obligatorio"),
    handleInputErrors,
    UserController.editUser
);

router.post(
    "/delete-user",
    authenticate,
    body("idUser").notEmpty().withMessage("El ID es obligatorio"),
    handleInputErrors,
    UserController.deleteUser
);

router.post(
    "/active-user",
    authenticate,
    body("idUser").notEmpty().withMessage("El ID es obligatorio"),
    handleInputErrors,
    UserController.activeUser
);
// ---- POST ---- //

// ---- GET ---- //
router.get("/users", authenticate, UserController.getAllUser);
router.get("/user/:idUser", authenticate, UserController.getUser);
// ---- GET ---- //
export default router;
