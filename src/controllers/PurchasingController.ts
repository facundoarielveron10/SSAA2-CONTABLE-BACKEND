import type { Request, Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Article, { ArticleType } from "../models/Article";
import PurchaseRequest from "../models/PurchaseRequest";
import PurchaseRequestDetails from "../models/PurchaseRequestDetails";

export class PurchasingController {
    static getAllPurchaseRequest = async (
        req: CustomRequest,
        res: Response
    ) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(
                id,
                "GET_PURCHASE_REQUEST"
            );

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { page, limit } = req.query;

            const pageNumber = page ? parseInt(page as string) : null;
            const pageSize = limit ? parseInt(limit as string) : null;

            // Obtener el total de registros sin paginado
            const totalPurchaseRequest = await PurchaseRequest.countDocuments(
                {}
            );

            let purchaseRequests = null;
            if (pageNumber !== null && pageSize !== null) {
                const skip = (pageNumber - 1) * pageSize;
                purchaseRequests = await PurchaseRequest.find({})
                    .skip(skip)
                    .limit(pageSize)
                    .populate("user", "email")
                    .exec();
            } else {
                purchaseRequests = await PurchaseRequest.find({})
                    .populate("user", "email")
                    .exec();
            }

            const totalPages = pageSize
                ? Math.ceil(totalPurchaseRequest / pageSize)
                : 1;

            res.send({ purchaseRequests, totalPages });
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getArticlesPurchaseRequest = async (
        req: CustomRequest,
        res: Response
    ) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(
                id,
                "GET_PURCHASE_REQUEST"
            );

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { idPurchaseRequest } = req.params;
            const articles = await PurchaseRequestDetails.find({
                request: idPurchaseRequest,
            })
                .select(["amount", "article", "-_id"])
                .populate("article", ["name", "description", "-_id"]);

            res.send(articles);
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static createPucharseRequest = async (
        req: CustomRequest,
        res: Response
    ) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(
                id,
                "CREATE_PURCHASE_REQUEST"
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
            const newPurcharseRequest = new PurchaseRequest({
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

            await PurchaseRequestDetails.insertMany(details);

            res.send("Pedido de compra realizado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
