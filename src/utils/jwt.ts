import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import Role from "../models/Role";

type UserPayload = {
    id: Types.ObjectId;
};

export const generateJWT = async (payload: UserPayload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "6m",
    });

    return token;
};
