import mongoose, { Schema, Document } from "mongoose";

export type RoleType = Document & {
    name: string;
    nameDescriptive: string;
    description: string;
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
});

const Role = mongoose.model<RoleType>("Role", roleSchema);
export default Role;
