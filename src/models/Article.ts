import mongoose, { Schema, Document } from "mongoose";

export type ArticleType = Document & {
    name: string;
    description: string;
    unitPrice: number;
};

const articleSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        require: true,
    },
    unitPrice: {
        type: Number,
        require: true,
    },
});

const Article = mongoose.model<ArticleType>("Article", articleSchema);
export default Article;
