import mongoose, { Schema, Document, Date, Types } from "mongoose";

export type PurcharseRequestDetailsType = Document & {
    amount: number;
    article: Types.ObjectId;
    request: Types.ObjectId;
};

const purcharseRequestDetailsSchema: Schema = new Schema({
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

const PurcharseRequestDetails = mongoose.model<PurcharseRequestDetailsType>(
    "PurcharseRequestDetails",
    purcharseRequestDetailsSchema
);
export default PurcharseRequestDetails;
