import type { Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Supplier from "../models/Supplier";
import Article, { ArticleType } from "../models/Article";
import Order from "../models/Order";
import OrderDetails from "../models/OrderDetails";
import { parseCustomDate } from "../utils/date";

export class OrderController {
    static createOrder = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "CREATE_ORDERS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { orders } = req.body;

            // Usamos Promise.all para manejar todas las órdenes de forma concurrente
            await Promise.all(
                orders.map(async (orderData: any) => {
                    // Validar que el supplier exista
                    const supplierId = orderData.supplier._id;
                    const supplierExists = await Supplier.findById(supplierId);
                    if (!supplierExists) {
                        const error = new Error(
                            "Unos de los proveedores no fue encontrado"
                        );
                        return res.status(404).json({ errors: error.message });
                    }

                    // Validar que cada artículo exista
                    await Promise.all(
                        orderData.articles.map(
                            async (articleData: ArticleType) => {
                                const articleId = articleData._id;
                                const articleExists = await Article.findById(
                                    articleId
                                );
                                if (!articleExists) {
                                    const error = new Error(
                                        "Unos de los articulos no fue encontrado"
                                    );
                                    return res
                                        .status(404)
                                        .json({ errors: error.message });
                                }
                            }
                        )
                    );

                    // Crear la Orden
                    const order = new Order({
                        description: orderData.description,
                        deliveryDate: parseCustomDate(orderData.deliveryDate),
                        receiptDate: null,
                        deliveryAddress: orderData.deliveryAddress,
                        currency: orderData.currency,
                        paymentMethod: orderData.paymentMethod,
                        supplier: supplierId,
                        completed: false,
                    });

                    const savedOrder = await order.save();

                    // Crear los detalles de la Orden
                    await Promise.all(
                        orderData.articles.map(async (articleData: any) => {
                            const orderDetail = new OrderDetails({
                                article: articleData._id,
                                order: savedOrder._id,
                                price: articleData.price,
                                quantity: articleData.quantity || 1,
                            });
                            await orderDetail.save();
                        })
                    );
                })
            );

            res.send("Ordenes creadas correctamente");
        } catch (error: any) {
            console.error(error);
            return res
                .status(500)
                .json({ errors: error.message || "Hubo un error" });
        }
    };

    static completedOrder = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "COMPLETED_ORDERS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            res.send("Orden completada correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
