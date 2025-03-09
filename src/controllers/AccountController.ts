import type { Response } from "express";
import { hasPermissions } from "../utils/auth";
import { codeType } from "../utils/accountSeat";
import { CustomRequest } from "../middleware/authenticate";
import Account from "../models/Account";

export class AccountController {
    static createAccount = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "CREATE_ACCOUNT");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            let { name, description, type, accountId } = req.body;

            const nameAccount = name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            name = nameAccount.toLowerCase();

            const accountExist = await Account.findOne({ name });
            if (accountExist) {
                const error = new Error("La cuenta ya ha sido registrada");
                return res.status(409).json({ errors: error.message });
            }

            let parentAccountId = null;
            if (accountId) {
                const accountParent = await Account.findById(accountId);
                parentAccountId = accountParent._id;
            }
            const code = await codeType(type, parentAccountId);

            const newAccount = new Account({
                name,
                nameAccount,
                description,
                type,
                balance: 0,
                account: accountId,
                code,
            });
            await newAccount.save();

            res.send("Cuenta creada correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static editAccount = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "EDIT_ACCOUNT");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            let { idAccount, name, description } = req.body;

            const account = await Account.findById(idAccount);
            if (!account) {
                const error = new Error("La Cuenta no ha sido encontrada");
                return res.status(404).json({ errors: error.message });
            }

            const nameAccount = name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            name = nameAccount.toLowerCase();

            account.name = name;
            account.nameAccount = nameAccount;
            account.description = description;
            account.save();

            res.send("Cuenta actualizada correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getAllAccount = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_ACCOUNTS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { page, limit } = req.query;

            const pageNumber = page ? parseInt(page as string) : null;
            const pageSize = limit ? parseInt(limit as string) : null;

            const totalAccounts = await Account.countDocuments({});

            let accounts = null;
            if (pageNumber !== null && pageSize !== null) {
                const skip = (pageNumber - 1) * pageSize;
                accounts = await Account.find({})
                    .skip(skip)
                    .limit(pageSize)
                    .exec();
            } else {
                accounts = await Account.find({}).exec();
            }

            const totalPages = pageSize
                ? Math.ceil(totalAccounts / pageSize)
                : 1;

            res.send({
                accounts,
                totalPages,
            });
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getAccountsChildless = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_ACCOUNTS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(403).json({ errors: error.message });
            }

            const childAccounts = await Account.distinct("account", {
                account: { $ne: null },
            });

            const childlessAccounts = await Account.find({
                _id: { $nin: childAccounts },
            });

            res.send(childlessAccounts);
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getAccount = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const { idAccount } = req.params;

            const permissions = await hasPermissions(id, "GET_ACCOUNTS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const account = await Account.findById(idAccount).select("-__v");
            if (!account) {
                const error = new Error("El Usuario no ha sido encontrado");
                return res.status(404).json({ errors: error.message });
            }

            res.send(account);
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
