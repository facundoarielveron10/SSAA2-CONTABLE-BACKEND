import mongoose, { Schema, Document, Date, Types } from "mongoose";

export type OrderType = Document & {
    description: string;
    deliveryDate: Date;
    receiptDate: Date;
    deliveryAddres: string;
    currency: string;
    paymentMethod: string;
    completed: boolean;
    supplier: Types.ObjectId;
};

const orderSchema: Schema = new Schema({
    description: {
        type: String,
        require: true,
    },
    deliveryDate: {
        type: Date,
        require: true,
    },
    receiptDate: {
        type: Date,
        require: true,
    },
    deliveryAddress: {
        type: String,
        require: false,
    },
    currency: {
        type: String,
        require: false,
    },
    paymentMethod: {
        type: String,
        require: false,
    },
    completed: {
        type: Boolean,
        require: true,
        default: false,
    },
    supplier: {
        type: Types.ObjectId,
        ref: "Supplier",
    },
});

const Order = mongoose.model<OrderType>("Order", orderSchema);
export default Order;
