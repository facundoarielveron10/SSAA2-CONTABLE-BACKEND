import Account from "../models/Account";
import AccountSeat from "../models/AccountSeat";
import Seat from "../models/Seat";
import { ClientSession } from "mongoose";

interface Amount {
    amount: number;
    type: string;
}
interface Seat {
    amount: Amount;
}

interface Totals {
    debe: number;
    haber: number;
}

export const codeType = async (
    type: string,
    parentAccountId: string | null
) => {
    const baseCodes: { [key: string]: number } = {
        Activo: 1000,
        Pasivo: 2000,
        "R+": 3000,
        "R-": 4000,
        PN: 5000,
    };

    if (parentAccountId) {
        // Si hay un padre, obtenemos el código de la cuenta padre
        const parentAccount = await Account.findById(parentAccountId);
        if (!parentAccount) {
            throw new Error(
                `Cuenta padre con ID ${parentAccountId} no encontrada.`
            );
        }

        const parentCode = parentAccount.code;

        // Buscar subcuentas del padre en múltiplos de 10 o múltiplos de 1 si es subsubcuenta
        const lastSubAccount = await Account.find({
            account: parentAccountId, // Filtramos por cuentas que tengan el mismo padre
        })
            .sort({ code: -1 }) // Ordenamos por el código en forma descendente
            .limit(1);

        if (lastSubAccount.length) {
            // Si ya hay subcuentas, incrementamos el código de la última hija
            const lastSubCode = lastSubAccount[0].code;

            // Si el código del padre termina en "00", la siguiente subcuenta será en múltiplos de 10
            if (parentCode % 100 === 0) {
                return lastSubCode + 10;
            } else {
                // Si el padre no está en múltiplos de 100, la siguiente subcuenta será en múltiplos de 1
                return lastSubCode + 1;
            }
        } else {
            // Si no hay subcuentas, asignamos el primer código hijo: 10 o 1
            return parentCode % 100 === 0 ? parentCode + 10 : parentCode + 1;
        }
    } else {
        // Si no hay cuenta padre, asignar código de nivel superior en bloques de 100
        const baseCode = baseCodes[type];

        if (!baseCode) {
            throw new Error(`Tipo de cuenta no válido: ${type}`);
        }

        const lastAccountForType = await Account.find({
            code: { $gte: baseCode, $lt: baseCode + 1000 },
        })
            .sort({ code: -1 })
            .limit(1);

        const newCodeForType = lastAccountForType.length
            ? Math.floor(lastAccountForType[0].code / 100) * 100 + 100
            : baseCode + 100;

        return newCodeForType;
    }
};

export const isValidValues = (debe: number, haber: number) => {
    if (debe > 0 && haber > 0) {
        return debe - haber === 0;
    }

    return false;
};

export const getTotalsDebeHaber = (seats: Seat[]): Totals => {
    return seats.reduce<Totals>(
        (totals, seat) => {
            const { amount } = seat;
            if (amount.type === "debe") {
                totals.debe += amount.amount;
            } else if (amount.type === "haber") {
                totals.haber += amount.amount;
            }
            return totals;
        },
        { debe: 0, haber: 0 }
    );
};

export const generateSeatsOrders = async (
    price: number,
    paymentMethod: string
) => {
    let idAccount = null;
    if (paymentMethod === "Efectivo") {
        idAccount = await Account.findOne({ code: 1100 });
    } else {
        idAccount = await Account.findOne({ code: 1200 });
    }
    const idInventoryAccount = await Account.findOne({ code: 1300 });
    const seats = [
        {
            account: idAccount._id,
            amount: { amount: price, type: "haber" },
        },
        {
            account: idInventoryAccount._id,
            amount: { amount: price, type: "debe" },
        },
    ];

    return seats;
};

export const createSeat = async (
    description: string,
    seats: Array<any>,
    userId: string,
    session?: ClientSession
) => {
    // VALIDAMOS QUE MINIMO HAYA 2 ASIENTOS
    if (!seats || seats.length < 2) {
        throw new Error("Mínimo 2 registros");
    }

    // OBTENEMOS TOTAL DEL DEBE Y HABER
    const { debe, haber } = getTotalsDebeHaber(seats);

    // VALIDAMOS QUE DEBE - HABER NOS DE 0
    if (!isValidValues(debe, haber)) {
        throw new Error('Valores de "debe" y "haber" incorrectos');
    }

    // OBTENEMOS EL ÚLTIMO NÚMERO DE ASIENTO
    const lastSeat = await Seat.findOne()
        .sort({ number: -1 })
        .session(session)
        .exec();
    const nextSeatNumber = lastSeat ? lastSeat.number + 1 : 1;

    // CREAMOS EL ASIENTO PRINCIPAL
    const newSeat = new Seat({
        date: Date.now(),
        description: description,
        user: userId,
        number: nextSeatNumber,
    });

    // GUARDAMOS EL ASIENTO
    await newSeat.save({ session });

    // CREAMOS UN ASIENTO POR CADA REGISTRO QUE NOS LLEGO
    for (const seat of seats) {
        // OBTENEMOS EL ID DE LA CUENTA Y EL MONTO
        const { account, amount } = seat;

        // ASIGNAMOS LOS VALORES DE DEBE Y HABER SEGÚN EL TIPO
        const debe = amount.type === "debe" ? amount.amount : 0;
        const haber = amount.type === "haber" ? amount.amount : 0;

        // BUSCAMOS LA CUENTA INVOLUCRADA EN EL ASIENTO
        const accountToUpdate = await Account.findById(account).session(
            session
        );
        // VALIDAMOS QUE EXISTA LA CUENTA
        if (!accountToUpdate) {
            throw new Error("Cuenta no encontrada");
        }

        // AJUSTE DEL BALANCE SEGÚN EL TIPO DE CUENTA
        let newBalance = 0;
        if (
            accountToUpdate.type === "Pasivo" ||
            accountToUpdate.type === "PN" ||
            accountToUpdate.type === "R+"
        ) {
            // Para "Pasivo", "PN" y "R+", aumentamos con el haber y disminuimos con el debe
            newBalance = accountToUpdate.balance + haber - debe;
        } else {
            // Para otros tipos de cuentas (e.g. Activo, R-), hacemos lo opuesto
            newBalance = accountToUpdate.balance + debe - haber;
        }

        // VALIDAMOS QUE EL NUEVO SALDO NO SEA NEGATIVO
        if (newBalance < 0) {
            throw new Error(
                `La cuenta ${accountToUpdate.nameAccount} quedaría con saldo negativo`
            );
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
};
