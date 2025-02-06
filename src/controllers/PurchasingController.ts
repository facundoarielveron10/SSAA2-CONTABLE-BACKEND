import type { Request, Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Article, { ArticleType } from "../models/Article";
import PurcharseRequest from "../models/PurcharseRequest";
import PurcharseRequestDetails from "../models/PurcharseRequestDetails";

export class PurchasingController {
    static createPucharseRequest = async (
        req: CustomRequest,
        res: Response
    ) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(
                id,
                "CREATE_PUCHARSE_REQUEST"
            );

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { description, requiredDate, priority, articles } = req.body;

            const articleIds = articles.map(
                (article: ArticleType) => article?.id
            );
            const foundArticles = await Article.find({
                _id: { $in: articleIds },
            });

            if (foundArticles.length !== articles.length) {
                return res.status(404).json({
                    errors: "Uno o más artículos no fueron encontrados",
                });
            }

            // Crear la solicitud de compra
            const newPurcharseRequest = new PurcharseRequest({
                description,
                requiredDate,
                priority,
                user: id,
            });

            await newPurcharseRequest.save();

            const details = articles.map(
                (article: { id: string; quantity: number }) => ({
                    amount: article.quantity,
                    article: article.id,
                    request: newPurcharseRequest._id,
                })
            );

            await PurcharseRequestDetails.insertMany(details);

            res.send("Pedido de compra realizado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
