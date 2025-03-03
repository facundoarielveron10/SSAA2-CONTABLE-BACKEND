import type { Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Supplier from "../models/Supplier";
import Article, { ArticleType } from "../models/Article";
import Order from "../models/Order";
import OrderDetails from "../models/OrderDetails";
import { parseCustomDate } from "../utils/date";
import PurchaseRequest from "../models/PurchaseRequest";
import { startSession } from "mongoose";

export class OrderController {
    static createOrder = async (req: CustomRequest, res: Response) => {
        // Iniciar una sesión de Mongoose
        const session = await startSession();
        try {
            // Inicia la transacción
            session.startTransaction();

            const id = req.user["id"];
            const permissions = await hasPermissions(id, "CREATE_ORDERS");
            if (!permissions) {
                throw new Error("El Usuario no tiene permisos");
            }

            const { orders, request } = req.body;

            // Procesamos las requests de forma concurrente
            await Promise.all(
                request.map(async (requestData: any) => {
                    const requestId = requestData._id;
                    // Pasamos la sesión a la consulta
                    const requestExists = await PurchaseRequest.findById(
                        requestId
                    ).session(session);
                    if (!requestExists) {
                        throw new Error(
                            "Unos de los pedidos de compras no fue encontrado"
                        );
                    }
                    requestExists.completed = true;
                    await requestExists.save({ session });
                })
            );

            // Procesamos las órdenes de forma concurrente
            await Promise.all(
                orders.map(async (orderData: any) => {
                    const supplierId = orderData.supplier._id;
                    // Validamos que el proveedor exista, pasando la sesión
                    const supplierExists = await Supplier.findById(
                        supplierId
                    ).session(session);
                    if (!supplierExists) {
                        throw new Error(
                            "Unos de los proveedores no fue encontrado"
                        );
                    }

                    // Validamos cada artículo en la orden
                    await Promise.all(
                        orderData.articles.map(
                            async (articleData: ArticleType) => {
                                const articleId = articleData._id;
                                const articleExists = await Article.findById(
                                    articleId
                                ).session(session);
                                if (!articleExists) {
                                    throw new Error(
                                        "Unos de los articulos no fue encontrado"
                                    );
                                }
                            }
                        )
                    );

                    // Creamos la Orden
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
                    const savedOrder = await order.save({ session });

                    // Creamos los detalles de la Orden
                    await Promise.all(
                        orderData.articles.map(async (articleData: any) => {
                            const orderDetail = new OrderDetails({
                                article: articleData._id,
                                order: savedOrder._id,
                                price: articleData.price,
                                quantity: articleData.quantity || 1,
                            });
                            await orderDetail.save({ session });
                        })
                    );
                })
            );

            await session.commitTransaction();
            res.send("Ordenes creadas correctamente");
        } catch (error: any) {
            await session.abortTransaction();
            res.status(500).json({ errors: error.message || "Hubo un error" });
        } finally {
            session.endSession();
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
