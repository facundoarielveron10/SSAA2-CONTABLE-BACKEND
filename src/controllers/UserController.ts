import type { Request, Response } from "express";
import User from "../models/User";
import {
    checkPassword,
    hashPassword,
    hasPermissions,
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

            const { page = 1, limit = 10 } = req.query;
            const pageNumber = parseInt(page as string) || 1;
            const pageSize = parseInt(limit as string) || 5;
            const skip = (pageNumber - 1) * pageSize;
            const role = (req.query.role as string) || null;

            const query: any = {};
            if (role) {
                const roleDocument = await Role.findOne({ name: role });
                query.role = roleDocument ? roleDocument._id : null;
            }

            const users = await User.find(query)
                .populate("role")
                .select([
                    "id",
                    "name",
                    "lastname",
                    "email",
                    "role",
                    "active",
                    "adminConfirmed",
                ])
                .skip(skip)
                .limit(pageSize);

            const totalUsers = await User.countDocuments(query);

            res.send({
                users,
                totalPages: Math.ceil(totalUsers / pageSize),
            });
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getUser = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const { idUser } = req.params;

            const permissions = await hasPermissions(id, "GET_USERS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const user = await User.findById(idUser)
                .populate({
                    path: "role",
                    select: "name -_id",
                })
                .select("-password -createdAt -updatedAt -__v");
            if (!user) {
                const error = new Error("El Usuario no ha sido encontrado");
                return res.status(404).json({ errors: error.message });
            }

            res.send(user);
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static createUser = async (req: Request, res: Response) => {
        try {
            const { password, email } = req.body;

            const userExists = await User.findOne({ email });
            if (userExists) {
                const error = new Error("El Usuario ya esta registrado");
                return res.status(409).json({ errors: error.message });
            }

            const user = new User(req.body);

            user.password = await hashPassword(password);

            const token = new Token();
            token.token = generateToken();
            token.user = user.id;

            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token,
            });

            user.role = await roleUser();

            await Promise.allSettled([user.save(), token.save()]);
            res.send("Usuario Creado Correctamente, revisa tu email");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static deleteUser = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "GET_USERS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }
            const { idUser } = req.body;

            const user = await User.findById(idUser);
            if (!user) {
                const error = new Error("El Usuario no fue encontrado");
                return res.status(404).json({ errors: error.message });
            }

            user.active = false;
            await user.save();

            res.send("Usuario eliminado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static activeUser = async (req: CustomRequest, res: Response) => {
        const id = req.user["id"];
        const permissions = await hasPermissions(id, "ACTIVE_USER");

        if (!permissions) {
            const error = new Error("El Usuario no tiene permisos");
            return res.status(409).json({ errors: error.message });
        }

        const { idUser } = req.body;

        const user = await User.findById(idUser);
        if (!user) {
            const error = new Error("El Usuario no fue encontrado");
            return res.status(404).json({ errors: error.message });
        }

        if (user.active) {
            const error = new Error("El Usuario no ha sido eliminado");
            return res.status(400).json({ errors: error.message });
        }

        user.active = true;
        await user.save();

        res.send("Usuario activado correctamente");
    };

    static createUserWithRole = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "CREATE_USER");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { name, lastname, password, email, role } = req.body;

            const userExists = await User.findOne({ email });
            if (userExists) {
                const error = new Error("El rol ya existe");
                return res.status(400).json({ errors: error.message });
            }

            const roleUser = await Role.findOne({ name: role });
            if (!roleUser) {
                const error = new Error("El Rol no fue encontrado");
                return res.status(404).json({ errors: error.message });
            }

            const user = new User({
                name,
                lastname,
                email,
                password,
                role: roleUser._id,
            });

            user.password = await hashPassword(password);

            const token = new Token();
            token.token = generateToken();
            token.user = user.id;

            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token,
            });

            await Promise.allSettled([user.save(), token.save()]);
            res.send("Usuario Creado Correctamente");
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

    static confirmAdminUser = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "CONFIRM_USER");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { idUser, confirmUser } = req.body;

            const user = await User.findById(idUser);
            if (!user) {
                const error = new Error("El Usuario no fue encontrado");
                return res.status(404).json({ errors: error.message });
            }

            if (confirmUser) {
                user.adminConfirmed = true;
                await user.save();
                res.send("Cuenta confirmada correctamente");
            } else {
                await user.deleteOne({});
                res.send("Cuenta denegada correctamente");
            }
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

            if (!user.active) {
                const error = new Error("El usuario ha sido eliminado");
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

            if (!user.adminConfirmed) {
                const error = new Error(
                    "El usuario no esta confirmado por un administrador"
                );
                return res.status(401).json({ errors: error.message });
            }

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
                confirmed: user.confirmed,
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

            const permissions = await hasPermissions(id, "CHANGE_ROLE");

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
            await user.save();

            res.send("El Rol ha sido cambiado exitosamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static editUser = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "EDIT_USER");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { idUser, name, lastname, password, email, role } = req.body;

            const userEdit = await User.findById(idUser);
            if (!userEdit) {
                const error = new Error("El Usuario no fue encontrado");
                return res.status(404).json({ errors: error.message });
            }

            userEdit.name = name;
            userEdit.lastname = lastname;

            if (password) {
                userEdit.password = await hashPassword(password);
            }

            if (email !== userEdit.email) {
                userEdit.email = email;
                userEdit.confirmed = false;

                const token = new Token();
                token.token = generateToken();
                token.user = userEdit.id;

                AuthEmail.sendConfirmationEmail({
                    email: userEdit.email,
                    name: userEdit.name,
                    token: token.token,
                });
            }

            const roleUser = await Role.findOne({ name: role });
            if (!roleUser) {
                const error = new Error("El Rol no fue encontrado");
                return res.status(404).json({ errors: error.message });
            }

            if (userEdit.role !== roleUser._id) {
                userEdit.role = roleUser.id;
            }

            userEdit.save();

            res.send("Usuario actualizado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static searchUser = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "GET_USERS");
            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { search } = req.body;
            const { page = 1, limit = 5 } = req.query;
            const pageNumber = parseInt(page as string) || 1;
            const pageSize = parseInt(limit as string) || 5;
            const skip = (pageNumber - 1) * pageSize;
            const role = (req.query.role as string) || null;

            if (!search) {
                const error = new Error(
                    "Debe proporcionar un término de búsqueda"
                );
                return res.status(400).json({ errors: error.message });
            }

            const query: any = {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { lastname: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            };

            if (role) {
                const roleDocument = await Role.findOne({ name: role });
                query.role = roleDocument ? roleDocument._id : null;
            }

            const users = await User.find(query)
                .populate("role")
                .select(["id", "name", "lastname", "email", "role", "active"])
                .skip(skip)
                .limit(pageSize);

            const totalUsers = await User.countDocuments(query);

            res.json({
                users,
                totalPages: Math.ceil(totalUsers / pageSize),
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
