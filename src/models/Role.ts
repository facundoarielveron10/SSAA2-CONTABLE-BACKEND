import mongoose, { Schema, Document } from "mongoose";

export type RoleType = Document & {
    name: string;
    nameDescriptive: string;
    description: string;
    active: boolean;
};

const roleSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    nameDescriptive: {
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

const Role = mongoose.model<RoleType>("Role", roleSchema);
export default Role;
