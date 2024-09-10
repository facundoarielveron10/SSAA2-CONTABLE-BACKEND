import mongoose, { Schema, Document, Types } from "mongoose";

export type UserType = Document & {
    name: string;
    lastname: string;
    email: string;
    password: string;
    confirmed: boolean;
    role: Types.ObjectId;
    active: boolean;
};

const userSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        lastname: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        confirmed: {
            type: Boolean,
            default: false,
        },
        role: {
            type: Types.ObjectId,
            ref: "Role",
        },
        active: {
            type: Boolean,
            require: true,
            default: true,
        },
    },
    { timestamps: true }
);

const User = mongoose.model<UserType>("User", userSchema);
export default User;
