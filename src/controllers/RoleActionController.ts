import type { Request, Response } from "express";
import Action from "../models/Action";
import Role from "../models/Role";
import RoleAction from "../models/RoleAction";
import { hasPermissions } from "../utils/auth";

export class RoleActionController {
    static getAllRoles = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const isAdminUser = await hasPermissions(id, "GET_ROLES");

            if (!isAdminUser) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const roles = await Role.find({});

            res.send(roles);
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getAllActions = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const permissions = await hasPermissions(id, "GET_ACTIONS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const actions = await Action.find({});

            res.send(actions);
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static createRole = async (req: Request, res: Response) => {
        try {
            const { name, nameDescriptive, description, actions } = req.body;

            const actionsData = await Action.find({ name: { $in: actions } });
            if (actionsData.length !== actions.length) {
                const error = new Error(
                    "Una o más acciones no existen en la base de datos"
                );
                return res.status(400).json({ errors: error.message });
            }

            const roleExist = await Role.findOne({ name: name });
            if (roleExist) {
                const error = new Error("El Rol ya existe");
                return res.status(400).json({ errors: error.message });
            }

            const newRole = new Role({
                name: name,
                nameDescriptive: nameDescriptive,
                description: description,
            });
            newRole.save();

            const roleActions = actionsData.map((action) => ({
                role: newRole._id,
                action: action._id,
            }));

            await RoleAction.insertMany(roleActions);

            res.send("Rol creado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
