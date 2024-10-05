import type { Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Seat from "../models/Seat";
import AccountSeat from "../models/AccountSeat";
import { getTotalsDebeHaber, isValidValues } from "../utils/accountSeat";
import mongoose from "mongoose";
import Account from "../models/Account";

export class AccountSeatController {
    static createSeat = async (req: CustomRequest, res: Response) => {
        // INICIAMOS LA TRANSACCION
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // OBTENEMOS EL ID DEL USUARIO AUTENTICADO
            const id = req.user["id"];

            // VERIFICAMOS LOS PERMISOS DEL USUARIO AUTENTICADO
            const permissions = await hasPermissions(id, "CREATE_SEAT");
            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            // OBTENEMOS LA DESCRIPCION Y LOS ASIENTOS
            const { description, seats } = req.body;

            // VALIDAMOS QUE MINIMO HAYA 2 ASIENTOS
            if (!seats || seats.length < 2) {
                const error = new Error("Mínimo 2 registros");
                return res.status(403).json({ errors: error.message });
            }

            // OBTENEMOS TOTAL DEL DEBE Y HABER
            const { debe, haber } = getTotalsDebeHaber(seats);

            // VALIDAMOS QUE DEBE - HABER NOS DE 0
            if (!isValidValues(debe, haber)) {
                const error = new Error(
                    'Valores de "debe" y "haber" incorrectos'
                );
                return res.status(403).json({ errors: error.message });
            }

            // CREAMOS EL ASIENTO PRINCIPAL
            const newSeat = new Seat({
                date: Date.now(),
                description: description,
                user: id,
            });

            // GUARDAMOS EL ASIENTO
            await newSeat.save({ session });

            // CREAMOS UN ASIENTO POR CADA REGISTRO QUE NOS LLEGO
            for (const seat of seats) {
                // OBTENEMOS EL ID DE LA CUENTA, DEBE Y HABER
                const { account, debe, haber } = seat;

                // BUSCAMOS LA CUENTA INVOLUCRADA EN EL ASIENTO
                const accountToUpdate = await Account.findById(account).session(
                    session
                );

                // VALIDAMOS QUE EXISTA LA CUENTA
                if (!accountToUpdate) {
                    const error = new Error("Cuenta no encontrada");
                    return res.status(404).json({ errors: error.message });
                }

                // CALCULAMOS EL NUEVO SALDO DE LA CUENTA INVOLUCRADA
                const newBalance = accountToUpdate.balance + (debe - haber);

                // VALIDAMOS QUE EL NUEVO SALDO NO SEA NEGATIVO
                if (newBalance < 0) {
                    const error = new Error(
                        `La cuenta ${accountToUpdate.nameAccount} quedaría con saldo negativo`
                    );
                    return res.status(403).json({ errors: error.message });
                }

                // ACTUALIZAMOS EL SALDO DE LA CUENTA INVOLUCRADA
                accountToUpdate.balance = newBalance;

                // CREAMOS EL ASIENTO
                const newAccountSeat = new AccountSeat({
                    account: account,
                    seat: newSeat._id,
                    debe: debe,
                    haber: haber,
                    balance: newBalance,
                });

                // GUARDAMOS EL ASIENTO Y LA CUENTA
                await Promise.allSettled([
                    newAccountSeat.save({ session }),
                    accountToUpdate.save({ session }),
                ]);
            }

            // CONFIRMAMOS LA TRANSACCION
            await session.commitTransaction();
            session.endSession();

            // ENVIAMOS EL MENSAJE DE EXITO
            res.send("Asiento creado correctamente");
        } catch (error) {
            // REVERTIMOS LA TRANSACCION EN CASO DE ERROR
            await session.abortTransaction();
            session.endSession();
            // ENVIAMOS EL MENSAJE DE ERROR
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
