import Account from "../models/Account";

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

    // Si tiene parentAccountId, buscamos el código del padre
    if (parentAccountId) {
        // Buscar la cuenta padre
        const parentAccount = await Account.findById(parentAccountId);
        if (!parentAccount) {
            throw new Error(
                `Cuenta padre con ID ${parentAccountId} no encontrada.`
            );
        }

        const parentCode = parentAccount.code;

        // Buscar si existen cuentas hijas directas (nivel +10)
        const lastDirectChildAccount = await Account.find({
            account: parentAccountId,
            code: { $gte: parentCode + 10, $lt: parentCode + 100 },
        })
            .sort({ code: -1 })
            .limit(1);

        if (lastDirectChildAccount.length) {
            // Si ya hay cuentas hijas directas, aumentamos en 10 para el siguiente hijo directo
            const newDirectChildCode =
                Math.floor(lastDirectChildAccount[0].code / 10) * 10 + 10;
            return newDirectChildCode;
        }

        // Si no hay cuentas hijas directas, buscamos subcuentas (nivel +1)
        const lastSubAccount = await Account.find({
            account: parentAccountId,
            code: { $gte: parentCode, $lt: parentCode + 10 },
        })
            .sort({ code: -1 })
            .limit(1);

        const newSubAccountCode = lastSubAccount.length
            ? lastSubAccount[0].code + 1
            : parentCode + 1;

        return newSubAccountCode;
    }

    // Si no tiene parentAccountId, es una cuenta de nivel superior
    const baseCode = baseCodes[type];

    if (!baseCode) {
        throw new Error(`Tipo de cuenta no válido: ${type}`);
    }

    // Buscar la última cuenta de este tipo de nivel superior
    const lastAccountForType = await Account.find({
        code: { $gte: baseCode, $lt: baseCode + 1000 },
    })
        .sort({ code: -1 })
        .limit(1);

    const newCodeForType = lastAccountForType.length
        ? Math.floor(lastAccountForType[0].code / 100) * 100 + 100
        : baseCode + 100;

    return newCodeForType;
};

export const isValidValues = async (debe: number, haber: number) => {
    if (debe > 0 && haber > 0) {
        return debe - haber === 0;
    }

    return false;
};
