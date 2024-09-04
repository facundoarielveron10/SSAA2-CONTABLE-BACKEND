import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export const SECRET_KEY: Secret = process.env.JWT_SECRET;

export interface CustomRequest extends Request {
    user: JwtPayload | string;
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        (req as CustomRequest).user = decoded;

        next();
    } catch (err) {
        res.status(401).send("Usuario no autenticado");
    }
};
