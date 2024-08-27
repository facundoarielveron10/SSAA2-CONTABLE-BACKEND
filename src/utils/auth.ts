import bcrypt from "bcrypt";
import Role from "../models/Role";
import User from "../models/User";

export const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

export const checkPassword = async (password: string, storedHash: string) => {
    return await bcrypt.compare(password, storedHash);
};

export const isAdmin = async (id: string) => {
    const user = await User.findById(id);
    const role = await Role.findById(user.role);

    if (!user) {
        throw new Error("El Usuario no ha sido encontrado");
    }

    if (!role) {
        throw new Error("El Rol del Usuario no ha sido encontrado");
    }

    if (role.name === "ROLE_ADMIN") {
        return true;
    } else {
        return false;
    }
};

export const roleUser = async () => {
    const role = await Role.findOne({ name: "ROLE_USER" });
    return role.id;
};

export const roleAdmin = async () => {
    const role = await Role.findOne({ name: "ROLE_ADMIN" });
    return role.id;
};
