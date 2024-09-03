import bcrypt from "bcrypt";
import Role from "../models/Role";
import User from "../models/User";
import RoleAction from "../models/RoleAction";
import jwt from "jsonwebtoken";

export const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

export const checkPassword = async (password: string, storedHash: string) => {
    return await bcrypt.compare(password, storedHash);
};

export const hasPermissions = async (id: string, action: string) => {
    const user = await User.findById(id);
    const role = await Role.findById(user.role);

    if (!user) {
        throw new Error("El Usuario no ha sido encontrado");
    }

    if (!role) {
        throw new Error("El Rol del Usuario no ha sido encontrado");
    }

    const actionNames = await RoleAction.aggregate([
        { $match: { role: user.role._id } },
        {
            $lookup: {
                from: "actions",
                localField: "action",
                foreignField: "_id",
                as: "actionInfo",
            },
        },
        { $unwind: "$actionInfo" },
        { $project: { _id: 0, name: "$actionInfo.name" } },
    ]);

    const hasPermission = actionNames.some(
        (a) => String(a.name) === String(action)
    );

    return hasPermission;
};

export const roleUser = async () => {
    const role = await Role.findOne({ name: "ROLE_USER" });
    return role.id;
};

export const roleAdmin = async () => {
    const role = await Role.findOne({ name: "ROLE_ADMIN" });
    return role.id;
};

export const idUser = (token: string) => {
    const secret = process.env.JWT_SECRET;

    try {
        const decoded = jwt.verify(token, secret);

        console.log(decoded);
    } catch (err) {
        console.error("Error al verificar/decodificar el token:", err.message);
    }
};
