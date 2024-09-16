import mongoose, { Schema, Document } from "mongoose";

export type AccountType = Document & {
    name: string;
    nameAccount: string;
    description: string;
    type: string;
    balance: number;
};

const accountSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    nameAccount: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
    },
});

const Account = mongoose.model<AccountType>("Account", accountSchema);
export default Account;
