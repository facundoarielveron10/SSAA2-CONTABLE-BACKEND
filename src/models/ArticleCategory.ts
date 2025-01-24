import mongoose, { Schema, Document, Types } from "mongoose";

export type ArticleCategoryType = Document & {
    article: Types.ObjectId;
    category: Types.ObjectId;
};

const articleCategorySchema: Schema = new Schema({
    article: {
        type: Types.ObjectId,
        ref: "Article",
    },
    category: {
        type: Types.ObjectId,
        ref: "Category",
    },
});

const ArticleCategory = mongoose.model<ArticleCategoryType>(
    "ArticleCategory",
    articleCategorySchema
);
export default ArticleCategory;
