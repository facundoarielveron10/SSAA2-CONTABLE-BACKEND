import type { Request, Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Category from "../models/Category";

export class CategoryController {
    static getAllCategories = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_CATEGORIES");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { page, limit } = req.query;

            const pageNumber = page ? parseInt(page as string) : null;
            const pageSize = limit ? parseInt(limit as string) : null;

            // OBTENER EL TOTAL DE REGISTROS SIN PAGINADO
            const totalCategories = await Category.countDocuments({});

            let categories = null;
            if (pageNumber !== null && pageSize !== null) {
                const skip = (pageNumber - 1) * pageSize;
                categories = await Category.find({})
                    .skip(skip)
                    .limit(pageSize)
                    .exec();
            } else {
                categories = await Category.find({}).exec();
            }

            const totalPages = pageSize
                ? Math.ceil(totalCategories / pageSize)
                : 1;

            res.send({ categories, totalPages });
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getAllCategoriesActives = async (
        req: CustomRequest,
        res: Response
    ) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_CATEGORIES");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { page, limit } = req.query;

            const pageNumber = page ? parseInt(page as string) : null;
            const pageSize = limit ? parseInt(limit as string) : null;

            // OBTENER EL TOTAL DE REGISTROS SIN PAGINADO
            const totalCategories = await Category.countDocuments({});

            let categories = null;
            if (pageNumber !== null && pageSize !== null) {
                const skip = (pageNumber - 1) * pageSize;
                categories = await Category.find({ active: true })
                    .skip(skip)
                    .limit(pageSize)
                    .exec();
            } else {
                categories = await Category.find({ active: true }).exec();
            }

            const totalPages = pageSize
                ? Math.ceil(totalCategories / pageSize)
                : 1;

            res.send({ categories, totalPages });
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getCategory = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_CATEGORIES");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { idCategory } = req.params;
            const category = await Category.findById(idCategory);
            if (!category) {
                const error = new Error("La categoria no fue encontrada");
                return res.status(404).json({ errors: error.message });
            }

            res.send(category);
        } catch (error) {
            console.log(error);
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static createCategory = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "CREATE_CATEGORIES");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { name, description } = req.body;
            const category = await Category.findOne({ name: name });
            if (category) {
                const error = new Error("La categoria ya existe");
                return res.status(400).json({ errors: error.message });
            }

            const newCategory = new Category({
                name: name,
                description: description,
            });
            await newCategory.save();

            res.send("Categoria creada correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static editCategory = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "EDIT_CATEGORIES");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { idCategory, newName, newDescription } = req.body;
            const category = await Category.findById(idCategory);
            if (!category) {
                const error = new Error("La categoria no existe");
                return res.status(404).json({ errors: error.message });
            }

            category.name = newName;
            category.description = newDescription;

            await category.save();

            res.send("Categoria actualizada correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static deleteCategory = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "DELETE_CATEGORIES");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }
            const { idCategory } = req.body;

            const category = await Category.findById(idCategory);
            if (!category) {
                const error = new Error("La Categoria no fue encontrada");
                return res.status(404).json({ errors: error.message });
            }

            category.active = false;
            await category.save();

            res.send("Categoria eliminada correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static activeCategory = async (req: CustomRequest, res: Response) => {
        const id = req.user["id"];
        const permissions = await hasPermissions(id, "ACTIVE_CATEGORIES");

        if (!permissions) {
            const error = new Error("El Usuario no tiene permisos");
            return res.status(409).json({ errors: error.message });
        }

        const { idCategory } = req.body;

        const category = await Category.findById(idCategory);
        if (!category) {
            const error = new Error("La Categoria no fue encontrada");
            return res.status(404).json({ errors: error.message });
        }

        if (category.active) {
            const error = new Error("La Categoria no ha sido eliminada");
            return res.status(400).json({ errors: error.message });
        }

        category.active = true;
        await category.save();

        res.send("Categoria activada correctamente");
    };
}
