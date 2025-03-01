import mongoose, { Schema, Document, Types } from "mongoose";

export type OrderDetailsType = Document & {
    article: Types.ObjectId;
    order: Types.ObjectId;
    price: number;
    quantity: number;
};

const orderDetailsSchema: Schema = new Schema({
    article: {
        type: Types.ObjectId,
        ref: "Article",
    },
    order: {
        type: Types.ObjectId,
        ref: "Order",
    },
    price: {
        type: Number,
        require: true,
    },
    quantity: {
        type: Number,
        require: true,
    },
});

const OrderDetails = mongoose.model<OrderDetailsType>(
    "OrderDetails",
    orderDetailsSchema
);
export default OrderDetails;
