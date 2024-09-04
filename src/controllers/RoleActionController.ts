import type { Request, Response } from "express";
import Action from "../models/Action";
import Role from "../models/Role";
import RoleAction from "../models/RoleAction";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";

export class RoleActionController {
    static getAllRoles = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "GET_ROLES");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const roles = await Role.find({});

            res.send(roles);
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getRoleActions = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const { idRole } = req.params;

            const permissions = await hasPermissions(id, "EDIT_ROLE");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const role = await Role.findById(idRole);

            const actions = await RoleAction.find({ role: idRole })
                .populate({
                    path: "action",
                    select: "name -_id",
                })
                .exec();

            res.send({
                role,
                actions,
            });
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getAllActions = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

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

    static createRole = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "CREATE_ROLE");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

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

    static editRole = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const {
                idRole,
                newName,
                newNameDescriptive,
                newDescription,
                newActions,
            } = req.body;

            const permissions = await hasPermissions(id, "EDIT_ROLE");
            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const role = await Role.findById(idRole);
            if (!role) {
                const error = new Error("El Rol no existe");
                return res.status(409).json({ errors: error.message });
            }

            role.name = newName;
            role.nameDescriptive = newNameDescriptive;
            role.description = newDescription;

            await role.save();

            await RoleAction.deleteMany({ role: idRole });

            const actionIds = await Action.find({
                name: { $in: newActions },
            }).select("_id");

            if (actionIds.length !== newActions.length) {
                const error = new Error("Una o más acciones no existen");
                return res.status(409).json({ errors: error.message });
            }

            const roleActions = actionIds.map((action) => ({
                role: idRole,
                action: action._id,
            }));

            await RoleAction.insertMany(roleActions);

            res.send("Rol actualizado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
