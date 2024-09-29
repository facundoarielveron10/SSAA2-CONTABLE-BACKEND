import type { Request, Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Account from "../models/Account";
import Seat from "../models/Seat";
import AccountSeat from "../models/AccountSeat";

export class AccountSeatController {
    static createSeat = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "CREATE_SEAT");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { accountId, date, description, debe, haber } = req.body;
            const account = await Account.findById(accountId);
            if (!account) {
                const error = new Error("La cuenta no ha sido encontrada");
                return res.status(404).json({ errors: error.message });
            }

            const seat = new Seat({
                date,
                description,
                user: id,
            });

            const accountSeat = new AccountSeat({
                account: account._id,
                seat: seat._id,
                debe,
                haber,
            });
            res.send("Asiento creado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
