import type { Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Account from "../models/Account";
import Seat from "../models/Seat";
import AccountSeat from "../models/AccountSeat";
import { isValidValues } from "../utils/accountSeat";

export class AccountSeatController {
    static createSeat = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "CREATE_SEAT");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { description, seats } = req.body;

            res.send("Asiento creado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
