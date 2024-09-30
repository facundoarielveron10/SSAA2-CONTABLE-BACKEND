import Account from "../models/Account";

export const codeType = async (type: string, accountName: string | null) => {
    // Mapeo de tipos y códigos base, incluyendo cuentas específicas por nombre
    const baseCodes: { [key: string]: number } = {
        Activo: 1000,
        Pasivo: 2000,
        "R+": 3000,
        "R-": 4000,
        PN: 5000,
    };

    // Cuentas principales y sus códigos iniciales basados en el nombre
    const specificAccounts: { [key: string]: number } = {
        caja: 1100, // Caja
        banco: 1200, // Banco
        proveedores: 2100, // Proveedores
        ventas: 3100, // Ventas
        sueldos: 4100, // Sueldos
        "capital social": 5100, // Capital Social
    };

    // Si el accountName no es null y es una de las cuentas específicas
    if (accountName && specificAccounts[accountName]) {
        const baseCode = specificAccounts[accountName];

        // Buscar la última cuenta de esta cuenta específica en la base de datos
        const lastAccount = await Account.find({
            code: { $gte: baseCode, $lt: baseCode + 100 },
        })
            .sort({ code: -1 })
            .limit(1);

        // Si ya existe una cuenta, incrementar el código
        const newCode = lastAccount.length
            ? lastAccount[0].code + 1
            : baseCode + 1;

        return newCode;
    }

    // Si el accountName es null o no es una cuenta específica, asignar un nuevo código según el tipo de cuenta
    const baseCode = baseCodes[type];

    if (!baseCode) {
        throw new Error(`Tipo de cuenta no válido: ${type}`);
    }

    // Buscar la última cuenta de este tipo en la base de datos
    const lastAccountForType = await Account.find({
        code: { $gte: baseCode, $lt: baseCode + 1000 },
    })
        .sort({ code: -1 })
        .limit(1);

    // Si ya existe una cuenta de este tipo, incrementar el código
    const newCodeForType = lastAccountForType.length
        ? lastAccountForType[0].code + 100
        : baseCode + 100;

    return newCodeForType;
};

export const isValidValues = async (debe: number, haber: number) => {
    if (debe > 0 && haber > 0) {
        return debe - haber === 0;
    }

    return false;
};
