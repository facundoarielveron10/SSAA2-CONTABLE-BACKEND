import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import Role from "../models/Role";

type UserPayload = {
    id: Types.ObjectId;
    name: string;
    lastname: string;
    email: string;
    role: string;
};

export const generateJWT = async (payload: UserPayload) => {
    const roleUser = await Role.findById(payload.role);

    if (!roleUser) {
        throw new Error("El rol del usuario no fue encontrado");
    }

    payload.role = roleUser.name;

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "6m",
    });

    return token;
};
