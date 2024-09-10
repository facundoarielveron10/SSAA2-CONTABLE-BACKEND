import jwt from "jsonwebtoken";
import { Types } from "mongoose";

type UserPayload = {
    id: Types.ObjectId;
    confirmed: boolean;
};

export const generateJWT = async (payload: UserPayload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });

    return token;
};
