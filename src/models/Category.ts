import mongoose, { Schema, Document } from "mongoose";

export type CategoryType = Document & {
    name: string;
    description: string;
    active: boolean;
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
    active: {
        type: Boolean,
        require: true,
        default: true,
    },
});

const Category = mongoose.model<CategoryType>("Category", categorySchema);
export default Category;
