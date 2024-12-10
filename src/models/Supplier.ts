import mongoose, { Schema, Document } from "mongoose";

export type SupplierType = Document & {
    name: string;
    address: string;
    phone: string;
    email: string;
    active: boolean;
};

const supplierSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
        },
        active: {
            type: Boolean,
            require: true,
            default: true,
        },
    },
    { timestamps: true }
);

const Supplier = mongoose.model<SupplierType>("Supplier", supplierSchema);
export default Supplier;
