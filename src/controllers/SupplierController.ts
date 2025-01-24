import type { Request, Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Supplier from "../models/Supplier";

export class SupplierController {
    static getAllSuppliers = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_SUPPLIERS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { page, limit } = req.query;

            const pageNumber = page ? parseInt(page as string) : null;
            const pageSize = limit ? parseInt(limit as string) : null;

            // OBTENER EL TOTAL DE REGISTROS SIN PAGINADO
            const totalSuppliers = await Supplier.countDocuments({});

            let suppliers = null;
            if (pageNumber !== null && pageSize !== null) {
                const skip = (pageNumber - 1) * pageSize;
                suppliers = await Supplier.find({})
                    .skip(skip)
                    .limit(pageSize)
                    .exec();
            } else {
                suppliers = await Supplier.find({}).exec();
            }

            const totalPages = pageSize
                ? Math.ceil(totalSuppliers / pageSize)
                : 1;

            res.send({ suppliers, totalPages });
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getSupplier = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_SUPPLIERS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { idSupplier } = req.params;
            const supplier = await Supplier.findById(idSupplier);
            if (!supplier) {
                const error = new Error("La categoria no fue encontrada");
                return res.status(404).json({ errors: error.message });
            }

            res.send(supplier);
        } catch (error) {
            console.log(error);
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static createSupplier = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "CREATE_SUPPLIERS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { name, address, phone, email } = req.body;
            const supplier = await Supplier.findOne({ email: email });
            if (supplier) {
                const error = new Error("El Proveedor ya existe");
                return res.status(400).json({ errors: error.message });
            }

            const phoneExist = await Supplier.findOne({ phone: phone });
            if (phoneExist) {
                const error = new Error(
                    "Ya existe un Proveedor con ese numero de telefono"
                );
                return res.status(400).json({ errors: error.message });
            }

            const newSupplier = new Supplier({
                name: name,
                address: address,
                phone: phone,
                email: email,
            });
            await newSupplier.save();

            res.send("Proveedor creado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static editSupplier = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "EDIT_SUPPLIERS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { idSupplier, newName, newAddress, newPhone, newEmail } =
                req.body;
            const supplier = await Supplier.findById(idSupplier);
            if (!supplier) {
                const error = new Error("El Proveedor no existe");
                return res.status(404).json({ errors: error.message });
            }

            supplier.name = newName;
            supplier.address = newAddress;
            supplier.phone = newPhone;
            supplier.email = newEmail;

            await supplier.save();

            res.send("Proveedor actualizado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static deleteSupplier = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "DELETE_SUPPLIERS");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }
            const { idSupplier } = req.body;

            const supplier = await Supplier.findById(idSupplier);
            if (!supplier) {
                const error = new Error("El Proveedor no fue encontrado");
                return res.status(404).json({ errors: error.message });
            }

            // FALTA DESACTIVAR LOS ARTICULOS

            supplier.active = false;
            await supplier.save();

            res.send("Proveedor eliminado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static activeSupplier = async (req: CustomRequest, res: Response) => {
        const id = req.user["id"];
        const permissions = await hasPermissions(id, "ACTIVE_SUPPLIERS");

        if (!permissions) {
            const error = new Error("El Usuario no tiene permisos");
            return res.status(409).json({ errors: error.message });
        }

        const { idSupplier } = req.body;

        const supplier = await Supplier.findById(idSupplier);
        if (!supplier) {
            const error = new Error("El Proveedor no fue encontrado");
            return res.status(404).json({ errors: error.message });
        }

        if (supplier.active) {
            const error = new Error("El Proveedor no ha sido eliminado");
            return res.status(400).json({ errors: error.message });
        }

        supplier.active = true;
        await supplier.save();

        res.send("Proveedor activado correctamente");
    };
}
