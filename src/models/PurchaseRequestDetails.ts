import mongoose, { Schema, Document, Date, Types } from "mongoose";

export type PurchaseRequestDetailsType = Document & {
    amount: number;
    article: Types.ObjectId;
    request: Types.ObjectId;
};

const purchaseRequestDetailsSchema: Schema = new Schema({
    amount: {
        type: Number,
        require: true,
    },
    article: {
        type: Types.ObjectId,
        ref: "Article",
    },
    request: {
        type: Types.ObjectId,
        ref: "PucharseRequest",
    },
});

const PurchaseRequestDetails = mongoose.model<PurchaseRequestDetailsType>(
    "PurchaseRequestDetails",
    purchaseRequestDetailsSchema
);
export default PurchaseRequestDetails;
