import mongoose, { Schema, Document } from "mongoose";

export type RoleType = Document & {
    name: string;
};

const roleSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
    },
});

const Role = mongoose.model<RoleType>("Role", roleSchema);
export default Role;
