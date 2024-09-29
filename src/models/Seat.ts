import mongoose, { Schema, Document, Date, Types } from "mongoose";

export type SeatType = Document & {
    date: Date;
    description: string;
    user: Types.ObjectId;
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
});

const Seat = mongoose.model<SeatType>("Seat", seatSchema);
export default Seat;
