import mongoose, { Schema, Document, Types } from "mongoose";

export type StockType = Document & {
    article: Types.ObjectId;
    stock: number;
    arrivalDate: Date;
    expirationDate: Date;
    state: string;
};

const stockSchema: Schema = new Schema({
    article: {
        type: Types.ObjectId,
        ref: "Article",
    },
    stock: {
        type: Number,
        require: true,
    },
    arrivalDate: {
        type: Date,
        require: true,
    },
    expirationDate: {
        type: Date,
        require: true,
    },
    state: {
        type: String,
        require: true,
    },
});

const Stock = mongoose.model<StockType>("Stock", stockSchema);
export default Stock;
