import mongoose, { Schema, Document, Date, Types } from "mongoose";

export type PurchaseRequestType = Document & {
    description: string;
    requiredDate: Date;
    priority: string;
    user: Types.ObjectId;
    request: Types.ObjectId;
};

const purchaseRequestSchema: Schema = new Schema({
    description: {
        type: String,
        require: true,
    },
    requiredDate: {
        type: Date,
        require: true,
    },
    priority: {
        type: String,
        require: true,
    },
    user: {
        type: Types.ObjectId,
        ref: "User",
    },
});

const PurchaseRequest = mongoose.model<PurchaseRequestType>(
    "PurchaseRequest",
    purchaseRequestSchema
);
export default PurchaseRequest;
