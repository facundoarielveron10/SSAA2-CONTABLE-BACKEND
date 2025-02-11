import mongoose, { Schema, Document } from "mongoose";

export type ArticleType = Document & {
    name: string;
    description: string;
    active: boolean;
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
    active: {
        type: Boolean,
        require: true,
        default: true,
    },
});

const Article = mongoose.model<ArticleType>("Article", articleSchema);
export default Article;
