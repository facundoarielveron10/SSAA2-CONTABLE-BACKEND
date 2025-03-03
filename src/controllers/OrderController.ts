import type { Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Supplier from "../models/Supplier";
import Article, { ArticleType } from "../models/Article";
import Order, { OrderType } from "../models/Order";
import OrderDetails from "../models/OrderDetails";
import { parseCustomDate } from "../utils/date";
import PurchaseRequest from "../models/PurchaseRequest";

export class OrderController {
    static createOrder = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "CREATE_ORDERS");
            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { orders, request } = req.body;

            // Procesamos las requests de forma concurrente
            await Promise.all(
                request.map(async (requestData: any) => {
                    const requestId = requestData._id;
                    // Pasamos la sesión a la consulta
                    const requestExists = await PurchaseRequest.findById(
                        requestId
                    );
                    if (!requestExists) {
                        const error = new Error(
                            "Unos de los pedidos de compras no fue encontrado"
                        );
                        return res.status(404).json({ errors: error.message });
                    }
                    requestExists.completed = true;
                    requestExists.save();
                })
            );

            // Procesamos las órdenes de forma concurrente
            await Promise.all(
                orders.map(async (orderData: any) => {
                    const supplierId = orderData.supplier._id;
                    // Validamos que el proveedor exista, pasando la sesión
                    const supplierExists = await Supplier.findById(supplierId);
                    if (!supplierExists) {
                        const error = new Error(
                            "Unos de los proveedores no fue encontrado"
                        );
                        return res.status(404).json({ errors: error.message });
                    }

                    // Validamos cada artículo en la orden

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
                    const savedOrder = await order.save();

                    // Creamos los detalles de la Orden
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
            res.status(500).json({ errors: "Hubo un error" });
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
            console.log(error);
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
