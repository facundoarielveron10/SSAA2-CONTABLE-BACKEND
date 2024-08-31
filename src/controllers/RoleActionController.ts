import type { Request, Response } from "express";
import Action from "../models/Action";
import Role from "../models/Role";
import RoleAction from "../models/RoleAction";

export class RoleActionController {
    static createRole = async (req: Request, res: Response) => {
        try {
            const { name, actions } = req.body;

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
            });
            newRole.save();

            const roleActions = actionsData.map((action) => ({
                role: newRole._id,
                action: action._id,
            }));

            await RoleAction.insertMany(roleActions);

            res.send("Role creado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
