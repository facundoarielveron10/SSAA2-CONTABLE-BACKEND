import Account from "../models/Account";

interface Seat {
    debe: number;
    haber: number;
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
            totals.debe += seat.debe;
            totals.haber += seat.haber;
            return totals;
        },
        { debe: 0, haber: 0 }
    );
};
