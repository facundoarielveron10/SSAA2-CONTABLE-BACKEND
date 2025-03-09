import mongoose, { Schema, Document, Types } from "mongoose";

export type StockType = Document & {
    article: Types.ObjectId;
    stock: number;
    arrivalDate: Date;
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
});

const Stock = mongoose.model<StockType>("Stock", stockSchema);
export default Stock;
