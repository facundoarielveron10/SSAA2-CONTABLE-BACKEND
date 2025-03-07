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

            // OBTENEMOS EL ÚLTIMO NÚMERO DE ASIENTO
            const lastSeat = await Seat.findOne().sort({ number: -1 }).exec();
            const nextSeatNumber = lastSeat ? lastSeat.number + 1 : 1;

            // CREAMOS EL ASIENTO PRINCIPAL
            const newSeat = new Seat({
                date: Date.now(),
                description: description,
                user: id,
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
                    const error = new Error("Cuenta no encontrada");
                    return res.status(404).json({ errors: error.message });
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
            console.log(error);
            // REVERTIMOS LA TRANSACCION EN CASO DE ERROR
            await session.abortTransaction();
            session.endSession();
            // ENVIAMOS EL MENSAJE DE ERROR
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getDiary = async (req: CustomRequest, res: Response) => {
        try {
            // OBTENEMOS EL ID DEL USUARIO AUTENTICADO
            const id = req.user["id"];

            // VERIFICAMOS LOS PERMISOS DEL USUARIO AUTENTICADO
            const permissions = await hasPermissions(id, "GET_DIARY");
            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            // OBTENER PÁGINA, LÍMITE, FECHA DESDE Y HASTA DE LOS QUERY PARAMS
            const { page, limit, from, to, reverse } = req.query;

            // PARSEAR PAGE Y LIMIT A NÚMEROS
            const pageNumber = page ? parseInt(page as string) : null;
            const pageSize = limit ? parseInt(limit as string) : null;

            // SI VIENEN FECHAS "DESDE" Y "HASTA", LAS UTILIZAMOS
            let startDate = null,
                endDate = null;
            if (from && to) {
                startDate = new Date(from as string);
                endDate = new Date(new Date(to as string).setHours(23, 59, 59));
            } else {
                // SI NO VIENEN FECHAS, UTILIZAMOS EL MES ACTUAL
                const now = new Date();
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0,
                    23,
                    59,
                    59
                );
            }

            // DETERMINAR EL ORDEN DE LOS ASIENTOS (ASC por defecto, DESC si reverse es true)
            const sortOrder = reverse && reverse === "true" ? -1 : 1;

            // CONSTRUIMOS EL PIPELINE DE AGREGACIÓN
            const aggregationPipeline: any[] = [
                {
                    $lookup: {
                        from: "seats",
                        localField: "seat",
                        foreignField: "_id",
                        as: "seat",
                    },
                },
                { $unwind: "$seat" },
                {
                    $lookup: {
                        from: "accounts",
                        localField: "account",
                        foreignField: "_id",
                        as: "account",
                    },
                },
                { $unwind: "$account" },
                {
                    $project: {
                        seatId: "$seat._id",
                        seat: {
                            date: "$seat.date",
                            description: "$seat.description",
                            user: "$user.email",
                        },
                        accountSeat: {
                            account: "$account.nameAccount",
                            debe: "$debe",
                            haber: "$haber",
                        },
                    },
                },
                {
                    $group: {
                        _id: "$seatId",
                        seat: { $first: "$seat" },
                        accountSeats: { $push: "$accountSeat" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        seat: 1,
                        accountSeats: 1,
                    },
                },
                // FILTRO POR FECHAS
                {
                    $match: {
                        "seat.date": { $gte: startDate, $lte: endDate },
                    },
                },
                // ORDENAR POR FECHA (ascendente o descendente según reverse)
                {
                    $sort: { "seat.date": sortOrder },
                },
            ];

            // Si se proporcionan 'page' y 'limit', agregamos los operadores $skip y $limit
            if (pageNumber && pageSize) {
                const skip = (pageNumber - 1) * pageSize;
                aggregationPipeline.push({ $skip: skip }, { $limit: pageSize });
            }

            // EJECUTAMOS LA CONSULTA
            const results = await AccountSeat.aggregate(aggregationPipeline);

            // CALCULAR EL NÚMERO TOTAL DE DOCUMENTOS (si hay paginación)
            const totalSeats = await AccountSeat.countDocuments({
                "seat.date": { $gte: startDate, $lte: endDate },
            });

            // SI HAY PAGINACION, CALCULAR EL TOTAL DE PAGINAS
            const totalPages = pageSize ? Math.ceil(totalSeats / pageSize) : 1;

            // DEVOLVER LOS RESULTADOS CON LA INFORMACIÓN DE PÁGINAS
            res.send({
                seats: results,
                totalPages: totalPages,
                currentPage: pageNumber || null,
            });
        } catch (error) {
            // ENVIAMOS EL MENSAJE DE ERROR
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getLedger = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_LEDGER");
            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { page, limit, from, to, reverse, search } = req.query;
            const pageNumber = page ? parseInt(page as string) : 1;
            const pageSize = limit ? parseInt(limit as string) : 4;

            let startDate = null,
                endDate = null;
            if (from && to) {
                startDate = new Date(from as string);
                endDate = new Date(new Date(to as string).setHours(23, 59, 59));
            } else {
                const now = new Date();
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0,
                    23,
                    59,
                    59
                );
            }

            const sortOrder = reverse && reverse === "true" ? -1 : 1;

            const aggregationPipeline: any[] = [
                {
                    $lookup: {
                        from: "seats",
                        localField: "seat",
                        foreignField: "_id",
                        as: "seat",
                    },
                },
                { $unwind: "$seat" },
                {
                    $lookup: {
                        from: "accounts",
                        localField: "account",
                        foreignField: "_id",
                        as: "account",
                    },
                },
                { $unwind: "$account" },
                {
                    $project: {
                        account: {
                            nameAccount: "$account.nameAccount",
                            type: "$account.type",
                            code: "$account.code",
                        },
                        seat: {
                            date: "$seat.date",
                            description: "$seat.description",
                        },
                        debe: "$debe",
                        haber: "$haber",
                        balance: "$balance",
                    },
                },
                {
                    $match: {
                        "account.type": {
                            $in: ["Activo", "Pasivo"],
                        },
                        "seat.date": { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: "$account.code",
                        account: { $first: "$account" },
                        seats: {
                            $push: {
                                seat: "$seat",
                                debe: "$debe",
                                haber: "$haber",
                                balance: "$balance",
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        seats: {
                            $filter: {
                                input: "$seats",
                                as: "seat",
                                cond: {
                                    $and: [
                                        {
                                            $gte: [
                                                "$$seat.seat.date",
                                                startDate,
                                            ],
                                        },
                                        { $lte: ["$$seat.seat.date", endDate] },
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        account: 1,
                        seats: 1,
                        openingBalance: {
                            $let: {
                                vars: {
                                    firstSeat: { $arrayElemAt: ["$seats", 0] },
                                },
                                in: {
                                    $switch: {
                                        branches: [
                                            {
                                                case: {
                                                    $in: [
                                                        "$account.type",
                                                        ["Pasivo"],
                                                    ],
                                                },
                                                then: {
                                                    $subtract: [
                                                        "$$firstSeat.balance",
                                                        "$$firstSeat.haber",
                                                    ],
                                                },
                                            },
                                            {
                                                case: {
                                                    $in: [
                                                        "$account.type",
                                                        ["Activo"],
                                                    ],
                                                },
                                                then: {
                                                    $subtract: [
                                                        "$$firstSeat.balance",
                                                        "$$firstSeat.debe",
                                                    ],
                                                },
                                            },
                                        ],
                                        default: "$$firstSeat.balance",
                                    },
                                },
                            },
                        },
                        finalBalance: {
                            $let: {
                                vars: {
                                    lastFilteredSeat: {
                                        $arrayElemAt: [
                                            "$seats",
                                            {
                                                $subtract: [
                                                    { $size: "$seats" },
                                                    1,
                                                ],
                                            },
                                        ],
                                    },
                                },
                                in: "$$lastFilteredSeat.balance",
                            },
                        },
                    },
                },
                {
                    $match: { "seats.0": { $exists: true } },
                },
                {
                    $sort: { "seats.seat.date": sortOrder },
                },
            ];

            // Añadir búsqueda si está presente
            if (search) {
                const searchRegex = new RegExp(search as string, "i");
                aggregationPipeline.push({
                    $match: {
                        $or: [
                            { "account.nameAccount": { $regex: searchRegex } },
                            { "seat.description": { $regex: searchRegex } },
                        ],
                    },
                });
            }

            // Paginación y conteo en una sola consulta usando $facet
            const results = await AccountSeat.aggregate([
                ...aggregationPipeline,
                {
                    $facet: {
                        paginatedResults: [
                            { $skip: (pageNumber - 1) * pageSize },
                            { $limit: pageSize },
                        ],
                        totalCount: [{ $count: "count" }],
                    },
                },
            ]);

            const paginatedResults = results[0].paginatedResults;
            const totalCount =
                results[0].totalCount.length > 0
                    ? results[0].totalCount[0].count
                    : 0;

            const totalPages = pageSize ? Math.ceil(totalCount / pageSize) : 1;

            res.send({
                ledger: paginatedResults,
                totalPages: totalPages,
                currentPage: pageNumber,
            });
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getSeats = async (req: CustomRequest, res: Response) => {
        try {
            // OBTENEMOS EL ID DEL USUARIO AUTENTICADO
            const id = req.user["id"];

            // VERIFICAMOS LOS PERMISOS DEL USUARIO AUTENTICADO
            const permissions = await hasPermissions(id, "GET_SEATS");
            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            // OBTENER PÁGINA, LÍMITE, FECHA DESDE Y HASTA DE LOS QUERY PARAMS
            const { page, limit, from, to, reverse } = req.query;

            // PARSEAR PAGE Y LIMIT A NÚMEROS
            const pageNumber = page ? parseInt(page as string) : null;
            const pageSize = limit ? parseInt(limit as string) : null;

            // SI VIENEN FECHAS "DESDE" Y "HASTA", LAS UTILIZAMOS
            let startDate = null,
                endDate = null;
            if (from && to) {
                startDate = new Date(from as string);
                endDate = new Date(new Date(to as string).setHours(23, 59, 59));
            } else {
                // SI NO VIENEN FECHAS, UTILIZAMOS EL MES ACTUAL
                const now = new Date();
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0,
                    23,
                    59,
                    59
                );
            }

            // OBTENER EL TOTAL DE REGISTROS SIN PAGINADO
            const totalSeats = await Seat.countDocuments({
                date: { $gte: startDate, $lte: endDate },
            });

            // DETERMINAR EL ORDEN DE LOS ASIENTOS (DESC si reverse es true, ASC en caso contrario)
            const sortOrder = reverse && reverse === "true" ? -1 : 1;

            // CONFIGURACIÓN PARA EL PAGINADO
            let seats = null;
            if (pageNumber !== null && pageSize !== null) {
                const skip = (pageNumber - 1) * pageSize;
                seats = await Seat.find(
                    { date: { $gte: startDate, $lte: endDate } },
                    "date description number user"
                )
                    .sort({ date: sortOrder })
                    .skip(skip)
                    .limit(pageSize)
                    // Usamos populate para traer el email del usuario
                    .populate("user", "email")
                    .exec();
            } else {
                // Si no hay paginación, traer todos los registros
                seats = await Seat.find(
                    { date: { $gte: startDate, $lte: endDate } },
                    "date description number user"
                )
                    .sort({ date: sortOrder })
                    // Usamos populate para traer el email del usuario
                    .populate("user", "email")
                    .exec();
            }

            // CALCULAR TOTAL DE PÁGINAS
            const totalPages = pageSize ? Math.ceil(totalSeats / pageSize) : 1;

            // DEVOLVER LOS RESULTADOS
            res.send({
                seats,
                totalPages,
            });
        } catch (error) {
            // ENVIAMOS EL MENSAJE DE ERROR
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getSeat = async (req: CustomRequest, res: Response) => {
        try {
            // OBTENEMOS EL ID DEL USUARIO AUTENTICADO
            const id = req.user["id"];

            // VERIFICAMOS LOS PERMISOS DEL USUARIO AUTENTICADO
            const permissions = await hasPermissions(id, "GET_SEATS");
            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            // OBTENEMOS EL ID DEL ASIENTO
            const { idSeat } = req.params;

            // CONSTRUIMOS EL PIPELINE DE AGREGACIÓN PARA EL ASIENTO ESPECÍFICO
            const aggregationPipeline: any[] = [
                { $match: { seat: new mongoose.Types.ObjectId(idSeat) } }, // Filtra por idSeat
                {
                    $lookup: {
                        from: "seats",
                        localField: "seat",
                        foreignField: "_id",
                        as: "seat",
                    },
                },
                { $unwind: "$seat" },
                {
                    $lookup: {
                        from: "users",
                        localField: "seat.user",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: "$user" },
                {
                    $lookup: {
                        from: "accounts",
                        localField: "account",
                        foreignField: "_id",
                        as: "account",
                    },
                },
                { $unwind: "$account" },
                {
                    $project: {
                        seatId: "$seat._id",
                        seat: {
                            date: "$seat.date",
                            description: "$seat.description",
                            user: "$user.email",
                        },
                        accountSeat: {
                            account: "$account.nameAccount",
                            debe: "$debe",
                            haber: "$haber",
                        },
                    },
                },
                {
                    $group: {
                        _id: "$seatId",
                        seat: { $first: "$seat" },
                        accountSeats: { $push: "$accountSeat" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        seat: 1,
                        accountSeats: 1,
                    },
                },
            ];

            // EJECUTAMOS LA CONSULTA
            const seat = await AccountSeat.aggregate(aggregationPipeline);

            // VERIFICAR SI SE ENCONTRÓ EL ASIENTO
            if (!seat) {
                const error = new Error("El Asiento no fue encontrado");
                return res.status(404).json({ errors: error.message });
            }

            // DEVOLVER LOS RESULTADOS (SOLO UNO, PORQUE SE FILTRA POR idSeat)
            res.send(seat);
        } catch (error) {
            // ENVIAMOS EL MENSAJE DE ERROR
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
