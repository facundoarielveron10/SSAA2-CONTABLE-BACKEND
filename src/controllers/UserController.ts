import type { Request, Response } from "express";
import User from "../models/User";
import {
    checkPassword,
    hashPassword,
    hasPermissions,
    idUser,
    roleUser,
} from "../utils/auth";
import Token from "../models/Token";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";
import { generateJWT } from "../utils/jwt";
import Role from "../models/Role";
import RoleAction from "../models/RoleAction";
import { CustomRequest } from "../middleware/authenticate";

export class UserController {
    static getAllUser = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "GET_USERS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const users = await User.find({})
                .populate("role")
                .select(["id", "name", "lastname", "email", "role"]);

            res.send(users);
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static createUser = async (req: Request, res: Response) => {
        try {
            const { password, email } = req.body;

            // Prevenir usuarios duplicados
            const userExists = await User.findOne({ email });
            if (userExists) {
                const error = new Error("El Usuario ya esta registrado");
                return res.status(409).json({ errors: error.message });
            }

            // Crear un usuario
            const user = new User(req.body);

            // Hashear la contraseña
            user.password = await hashPassword(password);

            // Generar el token
            const token = new Token();
            token.token = generateToken();
            token.user = user.id;

            // Enviar el email
            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token,
            });

            // Asignar rol de usuario
            user.role = await roleUser();

            // Guardar el usuario
            await Promise.allSettled([user.save(), token.save()]);
            res.send("Usuario Creado Correctamente, revisa tu email");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static confirmUser = async (req: Request, res: Response) => {
        try {
            const { token } = req.body;

            const tokenExists = await Token.findOne({ token });
            if (!tokenExists) {
                const error = new Error("Token no valido");
                return res.status(404).json({ errors: error.message });
            }

            const user = await User.findById(tokenExists.user);
            user.confirmed = true;

            await Promise.allSettled([user.save(), tokenExists.deleteOne()]);

            res.send("Cuenta confirmada correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email }).populate("role").exec();

            if (!user) {
                const error = new Error("El usuario no fue encontrado");
                return res.status(404).json({ errors: error.message });
            }

            if (!user.confirmed) {
                const token = new Token();
                token.user = user.id;
                token.token = generateToken();
                AuthEmail.sendConfirmationEmail({
                    email: user.email,
                    name: user.name,
                    token: token.token,
                });

                await token.save();
                const error = new Error(
                    "El usuario no esta confirmado, hemos enviado un email de confirmacion"
                );
                return res.status(401).json({ errors: error.message });
            }

            // Revisar Password
            const isPasswordCorrect = await checkPassword(
                password,
                user.password
            );
            if (!isPasswordCorrect) {
                const error = new Error("La contraseña es incorrecta");
                return res.status(401).json({ errors: error.message });
            }

            const token = await generateJWT({
                id: user.id,
            });

            const roleActions = await RoleAction.find({ role: user.role._id })
                .populate({
                    path: "action",
                    select: "name -_id",
                })
                .exec();

            const actions = roleActions
                .map((roleAction) => {
                    if ("name" in roleAction.action) {
                        return (roleAction.action as any).name;
                    }
                    return null;
                })
                .filter((action): action is string => action !== null);

            res.send({
                jwt: token,
                user: {
                    id: user.id,
                    name: user.name,
                    lastname: user.lastname,
                    email: user.email,
                    role: user.role,
                    actions: actions,
                },
            });
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static resetPassword = async (req: Request, res: Response) => {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                const error = new Error("El Usuario no esta registrado");
                return res.status(409).json({ errors: error.message });
            }

            const token = new Token();
            token.token = generateToken();
            token.user = user.id;
            await token.save();

            AuthEmail.sendPasswordResetToken({
                email: user.email,
                name: user.name,
                token: token.token,
            });

            res.send("Revisa tu email para instrucciones");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static validateToken = async (req: Request, res: Response) => {
        try {
            const { token } = req.body;

            const tokenExists = await Token.findOne({ token });
            if (!tokenExists) {
                const error = new Error("Token no valido");
                return res.status(404).json({ errors: error.message });
            }

            res.send("Token validado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static updatePassword = async (req: Request, res: Response) => {
        try {
            const { token } = req.params;
            const { password } = req.body;

            const tokenExists = await Token.findOne({ token });
            if (!tokenExists) {
                const error = new Error("Token no valido");
                return res.status(404).json({ errors: error.message });
            }

            const user = await User.findById(tokenExists.user);
            user.password = await hashPassword(password);

            await Promise.allSettled([user.save(), tokenExists.deleteOne()]);

            res.send("El Password se Modifico Correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static changeRole = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "CHANGE_ROL");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { role, userId } = req.body;

            const newRole = await Role.findOne({ name: role });
            if (!newRole) {
                const error = new Error("El rol no existe");
                return res.status(404).json({ errors: error.message });
            }

            const user = await User.findById(userId);
            if (String(user.role) === String(newRole.id)) {
                const error = new Error("El Usuario ya posee ese rol");
                return res.status(404).json({ errors: error.message });
            }

            user.role = newRole.id;
            user.save();

            res.send("El Rol ha sido cambiado exitosamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
