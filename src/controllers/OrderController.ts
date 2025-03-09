import type { Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Supplier from "../models/Supplier";
import Article, { ArticleType } from "../models/Article";
import Order, { OrderType } from "../models/Order";
import OrderDetails from "../models/OrderDetails";
import { parseCustomDate } from "../utils/date";
import PurchaseRequest from "../models/PurchaseRequest";
import Stock from "../models/Stock";
import { createSeat, generateSeatsOrders } from "../utils/accountSeat";
import { startSession } from "mongoose";

export class OrderController {
    static createOrder = async (req: CustomRequest, res: Response) => {
        const session = await startSession();
        try {
            await session.withTransaction(async () => {
                const id = req.user["id"];
                const permissions = await hasPermissions(
                    id,
                    "CREATE_PURCHASE_ORDERS"
                );
                if (!permissions) {
                    throw new Error("El Usuario no tiene permisos");
                }

                const { orders, request } = req.body;

                // Procesamos las requests de forma concurrente
                await Promise.all(
                    request.map(async (requestData: any) => {
                        const requestId = requestData._id;
                        const requestExists = await PurchaseRequest.findById(
                            requestId
                        ).session(session);
                        if (!requestExists) {
                            throw new Error(
                                "Uno de los pedidos de compras no fue encontrado"
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
                        const supplierExists = await Supplier.findById(
                            supplierId
                        ).session(session);
                        if (!supplierExists) {
                            throw new Error(
                                "Uno de los proveedores no fue encontrado"
                            );
                        }

                        // Validamos cada artículo en la orden
                        await Promise.all(
                            orderData.articles.map(
                                async (articleData: ArticleType) => {
                                    const articleId = articleData._id;
                                    const articleExists =
                                        await Article.findById(
                                            articleId
                                        ).session(session);
                                    if (!articleExists) {
                                        throw new Error(
                                            "Uno de los articulos no fue encontrado"
                                        );
                                    }
                                }
                            )
                        );

                        // Creamos la Orden
                        const order = new Order({
                            description: orderData.description,
                            deliveryDate: parseCustomDate(
                                orderData.deliveryDate
                            ),
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
                                    subtotal:
                                        articleData.price *
                                        articleData.quantity,
                                    quantity: articleData.quantity || 1,
                                });
                                await orderDetail.save({ session });
                            })
                        );
                    })
                );
            });

            res.send("Ordenes creadas correctamente");
        } catch (error: any) {
            res.status(500).json({ errors: error.message || "Hubo un error" });
        } finally {
            session.endSession();
        }
    };

    static completedOrder = async (req: CustomRequest, res: Response) => {
        const session = await startSession();

        try {
            await session.withTransaction(async () => {
                const id = req.user["id"];
                const permissions = await hasPermissions(
                    id,
                    "COMPLETED_ORDERS"
                );
                if (!permissions) {
                    throw new Error("El Usuario no tiene permisos");
                }

                const { idOrder } = req.body;
                const order = await Order.findById(idOrder).session(session);
                if (!order) {
                    throw new Error("La Orden de Compra no fue encontrada");
                }

                const orderDetails = await OrderDetails.find({
                    order: order._id,
                })
                    .populate("article")
                    .session(session);
                if (!orderDetails || orderDetails.length === 0) {
                    throw new Error(
                        "Los Detalles de la Orden de Compra no fueron encontrados"
                    );
                }

                // CREAMOS LOS STOCKS
                await Promise.all(
                    orderDetails.map(async (detail) => {
                        const article = await Article.findById(
                            detail.article._id
                        ).session(session);
                        if (!article) {
                            throw new Error(
                                "Uno de los artículos de la Orden de Compra no fue encontrado"
                            );
                        }

                        const newStock = new Stock({
                            article: article._id,
                            stock: detail.quantity,
                            arrivalDate: new Date(),
                        });
                        await newStock.save({ session });
                    })
                );

                // REALIZAMOS LOS ASIENTOS CORRESPONDIENTES
                const description = order.description;
                const totalPrice = orderDetails.reduce(
                    (acum, item) => acum + item.subtotal,
                    0
                );
                const seats = await generateSeatsOrders(
                    totalPrice,
                    order.paymentMethod
                );

                await createSeat(description, seats, id, session);

                order.completed = true;
                await order.save({ session });
            });

            res.send("Orden completada correctamente");
        } catch (error: any) {
            res.status(500).json({ errors: error.message || "Hubo un error" });
        } finally {
            session.endSession();
        }
    };

    static getAllOrders = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_PURCHASE_ORDERS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { page, limit } = req.query;

            const pageNumber = page ? parseInt(page as string) : null;
            const pageSize = limit ? parseInt(limit as string) : null;

            // Obtener el total de registros sin paginado
            const totalOrders = await Order.countDocuments({});

            let orders = null;
            if (pageNumber !== null && pageSize !== null) {
                const skip = (pageNumber - 1) * pageSize;
                orders = await Order.find({})
                    .populate("supplier")
                    .skip(skip)
                    .limit(pageSize)
                    .exec();
            } else {
                orders = await Order.find({}).populate("supplier").exec();
            }

            const ordersData = await Promise.all(
                orders.map(async (order: OrderType) => {
                    const orderDetail = await OrderDetails.find({
                        order: order._id,
                    })
                        .populate("article")
                        .exec();

                    return {
                        ...order.toObject(),
                        details: orderDetail,
                    };
                })
            );

            const totalPages = pageSize ? Math.ceil(totalOrders / pageSize) : 1;

            res.send({ orders: ordersData, totalPages });
        } catch (error) {
            console.log(error);
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getAllDetailsPurchaseOrder = async (
        req: CustomRequest,
        res: Response
    ) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "SHOW_DETAILS_ORDER");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { idPurchaseOrder } = req.params;

            const details = await OrderDetails.find({
                order: idPurchaseOrder,
            })
                .populate(["article", "order"])
                .exec();

            res.send(details);
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
