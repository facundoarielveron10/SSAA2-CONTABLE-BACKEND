import mongoose, { Schema, Document, Types } from "mongoose";

export type AccountSeatType = Document & {
    account: Types.ObjectId;
    seat: Types.ObjectId;
};

const accountSeatSchema: Schema = new Schema({
    account: {
        type: Types.ObjectId,
        ref: "Account",
    },
    seat: {
        type: Types.ObjectId,
        ref: "Seat",
    },
    debe: {
        type: Number,
        require: true,
    },
    haber: {
        type: Number,
        require: true,
    },
    balance: {
        type: Number,
        require: true,
    },
});

const AccountSeat = mongoose.model<AccountSeatType>(
    "AccountSeat",
    accountSeatSchema
);
export default AccountSeat;
