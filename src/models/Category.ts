import mongoose, { Schema, Document } from "mongoose";

export type CategoryType = Document & {
    name: string;
    description: string;
};

const categorySchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        require: true,
    },
});

const Category = mongoose.model<CategoryType>("Category", categorySchema);
export default Category;
