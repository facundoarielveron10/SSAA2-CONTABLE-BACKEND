import mongoose, { Schema, Document } from "mongoose";

export type ActionType = Document & {
    name: string;
    description: string;
    type: string;
};

const actionSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
});

const Action = mongoose.model<ActionType>("Action", actionSchema);
export default Action;
