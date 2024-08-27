import type { Request, Response } from "express";
import User from "../models/User";
import { checkPassword, hashPassword, isAdmin, roleUser } from "../utils/auth";
import Token from "../models/Token";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";
import { generateJWT } from "../utils/jwt";

export class UserController {
    static getAllUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const isAdminUser = await isAdmin(id);

            if (!isAdminUser) {
                const error = new Error("El Usuario no es Administrador");
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
            const user = await User.findOne({ email });

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
                name: user.name,
                lastname: user.lastname,
                email: user.email,
                role: String(user.role),
            });

            res.send(token);
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
}
