import mongoose, { Schema, Document, Date, Types } from "mongoose";

export type PurcharseRequestType = Document & {
    description: string;
    requiredDate: Date;
    priority: string;
    user: Types.ObjectId;
    request: Types.ObjectId;
};

const purcharseRequestSchema: Schema = new Schema({
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

const PurcharseRequest = mongoose.model<PurcharseRequestType>(
    "PurcharseRequest",
    purcharseRequestSchema
);
export default PurcharseRequest;
