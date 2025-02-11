import mongoose, { Schema, Document, Types } from "mongoose";

export type ArticleSupplierType = Document & {
    article: Types.ObjectId;
    supplier: Types.ObjectId;
    price: number;
};

const articleSupplierSchema: Schema = new Schema({
    article: {
        type: Types.ObjectId,
        ref: "Article",
    },
    supplier: {
        type: Types.ObjectId,
        ref: "Supplier",
    },
    price: {
        type: Number,
        require: true,
    },
});

const ArticleSupplier = mongoose.model<ArticleSupplierType>(
    "ArticleSupplier",
    articleSupplierSchema
);
export default ArticleSupplier;
