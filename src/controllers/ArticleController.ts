import type { Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Article from "../models/Article";
import Supplier from "../models/Supplier";
import Category from "../models/Category";
import ArticleCategory from "../models/ArticleCategory";
import ArticleSupplier from "../models/ArticleSupplier";

export class ArticleController {
    static createArticle = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "CREATE_ARTICLES");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { name, description, unitPrice, categories, suppliers } =
                req.body;

            const article = await Article.findOne({ name });
            if (article) {
                const error = new Error("El Articulo ya existe");
                return res.status(400).json({ errors: error.message });
            }

            const validCategories = await Category.find({
                _id: { $in: categories },
            });
            if (validCategories.length !== categories.length) {
                const error = new Error("Una o más categorías no existen");
                return res.status(400).json({ errors: error.message });
            }

            const validSuppliers = await Supplier.find({
                _id: { $in: suppliers },
            });
            if (validSuppliers.length !== suppliers.length) {
                const error = new Error("Uno o más proveedores no existen");
                return res.status(400).json({ errors: error.message });
            }

            // Crear el artículo
            const newArticle = new Article({
                name,
                description,
                unitPrice,
            });

            await newArticle.save();

            for (const category of categories) {
                const newArticleCategory = new ArticleCategory({
                    article: newArticle._id,
                    category,
                });

                await newArticleCategory.save();
            }

            for (const supplier of suppliers) {
                const newArticleSupplier = new ArticleSupplier({
                    article: newArticle._id,
                    supplier,
                });

                await newArticleSupplier.save();
            }

            res.send("Articulo Creado Correctamente");
        } catch (error) {
            console.error(error);
            return res.status(500).json({ errors: "Hubo un error" });
        }
    };
}
