import type { Request, Response } from "express";
import User from "../models/User";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Seat from "../models/Seat";

export class StatisticsController {
    static getStats = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_STATS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            // Obtiene el año actual si year no está definido en la consulta
            const { year } = req.query;
            const selectedYear = year
                ? parseInt(year as string)
                : new Date().getFullYear();

            // Array con los nombres de los meses
            const monthNames = [
                "Enero",
                "Febrero",
                "Marzo",
                "Abril",
                "Mayo",
                "Junio",
                "Julio",
                "Agosto",
                "Septiembre",
                "Octubre",
                "Noviembre",
                "Diciembre",
            ];

            // Inicializamos la estructura del resultado
            const monthlySeats = monthNames.map((month) => ({
                month,
                Asientos: 0,
            }));
            let totalSeats = 0;

            // Itera sobre cada mes y cuenta los asientos
            for (let month = 0; month < 12; month++) {
                const startDate = new Date(selectedYear, month, 1);
                const endDate = new Date(
                    selectedYear,
                    month + 1,
                    0,
                    23,
                    59,
                    59,
                    999
                ); // Último día del mes

                // Cantidad de asientos en el mes actual
                const seatsInMonth = await Seat.countDocuments({
                    date: { $gte: startDate, $lte: endDate },
                });

                monthlySeats[month].Asientos = seatsInMonth;
                totalSeats += seatsInMonth;
            }

            // Cantidad total de usuarios
            const totalUsers = await User.countDocuments();

            // Cantidad de usuarios confirmados
            const confirmedUsers = await User.countDocuments({
                confirmed: true,
            });

            // Cantidad de usuarios no confirmados
            const unconfirmedUsers = await User.countDocuments({
                confirmed: false,
            });

            res.status(200).json({
                totalUsers,
                confirmedUsers,
                unconfirmedUsers,
                monthlySeats,
                totalSeats, // Retorna el total de asientos como un campo separado
            });
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
