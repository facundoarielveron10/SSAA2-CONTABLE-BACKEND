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

            const categories = await Category.find({});

            res.send(categories);
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

            res.send("Categoria creada correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
