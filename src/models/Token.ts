import mongoose, { Schema, Document, Types } from "mongoose";

export type TokenType = Document & {
    token: string;
    user: Types.ObjectId;
    createdAt: Date;
};

const tokenSchema: Schema = new Schema({
    token: {
        type: String,
        required: true,
    },
    user: {
        type: Types.ObjectId,
        ref: "User",
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: "10m",
    },
});

const Token = mongoose.model<TokenType>("Token", tokenSchema);
export default Token;
