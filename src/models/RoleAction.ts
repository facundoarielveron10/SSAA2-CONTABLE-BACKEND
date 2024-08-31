import mongoose, { Schema, Document, Types } from "mongoose";

export type RoleActionType = Document & {
    role: Types.ObjectId;
    action: Types.ObjectId;
};

const roleActionSchema: Schema = new Schema({
    role: {
        type: Types.ObjectId,
        ref: "Role",
    },
    action: {
        type: Types.ObjectId,
        ref: "Action",
    },
});

const RoleAction = mongoose.model<RoleActionType>(
    "RoleAction",
    roleActionSchema
);
export default RoleAction;
