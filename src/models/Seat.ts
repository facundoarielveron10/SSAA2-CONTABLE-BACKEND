import mongoose, { Schema, Document, Date, Types } from "mongoose";

export type SeatType = Document & {
    date: Date;
    description: string;
    user: Types.ObjectId;
    number: number;
};

const seatSchema: Schema = new Schema({
    date: {
        type: Date,
        default: Date.now(),
    },
    description: {
        type: String,
        required: true,
    },
    user: {
        type: Types.ObjectId,
        ref: "User",
    },
    number: {
        type: Number,
        required: true,
        unique: true,
    },
});

const Seat = mongoose.model<SeatType>("Seat", seatSchema);
export default Seat;
