import type { Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Article from "../models/Article";
import Stock from "../models/Stock";

export class StockController {
    static getStock = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_STOCK");

            if (!permissions) {
                return res
                    .status(409)
                    .json({ errors: "El Usuario no tiene permisos" });
            }

            const { idArticle } = req.params;
            const article = await Article.findById(idArticle).exec();

            if (!article) {
                return res
                    .status(404)
                    .json({ errors: "El artículo no fue encontrado" });
            }

            const stock = await Stock.find({ article: idArticle });

            res.send(stock);
        } catch (error) {
            console.error(error);
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
