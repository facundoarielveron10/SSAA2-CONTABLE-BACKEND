import type { Response } from "express";
import { hasPermissions } from "../utils/auth";
import { CustomRequest } from "../middleware/authenticate";
import Article, { ArticleType } from "../models/Article";
import Supplier from "../models/Supplier";
import Category from "../models/Category";
import ArticleCategory from "../models/ArticleCategory";
import ArticleSupplier from "../models/ArticleSupplier";

export class ArticleController {
    static getAllArticles = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_ARTICLES");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }

            const { page, limit } = req.query;

            const pageNumber = page ? parseInt(page as string) : null;
            const pageSize = limit ? parseInt(limit as string) : null;

            // Obtener el total de registros sin paginado
            const totalArticles = await Article.countDocuments({});

            let articles = null;
            if (pageNumber !== null && pageSize !== null) {
                const skip = (pageNumber - 1) * pageSize;
                articles = await Article.find({})
                    .skip(skip)
                    .limit(pageSize)
                    .exec();
            } else {
                articles = await Article.find({}).exec();
            }

            const articlesData = await Promise.all(
                articles.map(async (article: ArticleType) => {
                    const categories = await ArticleCategory.find({
                        article: article._id,
                    })
                        .populate("category")
                        .exec();

                    const suppliers = await ArticleSupplier.find({
                        article: article._id,
                    })
                        .populate("supplier")
                        .exec();

                    return {
                        ...article.toObject(),
                        categories: categories.map((c) =>
                            c.get("category.name")
                        ),
                        suppliers: suppliers.map((s) => s.get("supplier.name")),
                    };
                })
            );

            const totalPages = pageSize
                ? Math.ceil(totalArticles / pageSize)
                : 1;

            res.send({ articles: articlesData, totalPages });
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static getArticle = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "GET_ARTICLES");

            if (!permissions) {
                return res
                    .status(409)
                    .json({ errors: "El Usuario no tiene permisos" });
            }

            const { idArticle } = req.params;
            const article = await Article.findById(idArticle).exec();

            if (!article) {
                return res
                    .status(404)
                    .json({ errors: "El artículo no fue encontrado" });
            }

            const categories = await ArticleCategory.find({
                article: article._id,
            })
                .populate("category")
                .exec();

            const suppliers = await ArticleSupplier.find({
                article: article._id,
            })
                .populate("supplier")
                .exec();

            const articleData = {
                ...article.toObject(),
                categories: categories.map((c) => ({
                    id: c.get("category._id"),
                    name: c.get("category.name"),
                })),
                suppliers: suppliers.map((s) => ({
                    id: s.get("supplier._id"),
                    name: s.get("supplier.name"),
                })),
            };

            res.send(articleData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

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

    static editArticle = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];
            const permissions = await hasPermissions(id, "EDIT_ARTICLES");

            if (!permissions) {
                return res
                    .status(409)
                    .json({ errors: "El Usuario no tiene permisos" });
            }

            const {
                idArticle,
                newName,
                newDescription,
                newPrice,
                newCategories,
                newSuppliers,
            } = req.body;

            const article = await Article.findById(idArticle).exec();
            if (!article) {
                return res
                    .status(404)
                    .json({ errors: "El Articulo no existe" });
            }

            // Actualizar datos básicos del artículo
            article.name = newName;
            article.description = newDescription;
            article.unitPrice = newPrice;
            await article.save();

            // Actualizar categorías del artículo
            await ArticleCategory.deleteMany({ article: idArticle });
            if (newCategories && newCategories.length > 0) {
                const categoryDocs = newCategories.map(
                    (categoryId: string) => ({
                        article: idArticle,
                        category: categoryId,
                    })
                );
                await ArticleCategory.insertMany(categoryDocs);
            }

            // Actualizar proveedores del artículo
            await ArticleSupplier.deleteMany({ article: idArticle });
            if (newSuppliers && newSuppliers.length > 0) {
                const supplierDocs = newSuppliers.map((supplierId: string) => ({
                    article: idArticle,
                    supplier: supplierId,
                }));
                await ArticleSupplier.insertMany(supplierDocs);
            }

            res.send("Artículo actualizado correctamente");
        } catch (error) {
            console.error(error);
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static deleteArticle = async (req: CustomRequest, res: Response) => {
        try {
            const id = req.user["id"];

            const permissions = await hasPermissions(id, "DELETE_ARTICLES");

            if (!permissions) {
                const error = new Error("El Usuario no tiene permisos");
                return res.status(409).json({ errors: error.message });
            }
            const { idArticle } = req.body;

            const article = await Article.findById(idArticle);
            if (!article) {
                const error = new Error("El Articulo no fue encontrado");
                return res.status(404).json({ errors: error.message });
            }

            article.active = false;
            await article.save();

            res.send("Articulo eliminado correctamente");
        } catch (error) {
            res.status(500).json({ errors: "Hubo un error" });
        }
    };

    static activeArticle = async (req: CustomRequest, res: Response) => {
        const id = req.user["id"];
        const permissions = await hasPermissions(id, "ACTIVE_ARTICLES");

        if (!permissions) {
            const error = new Error("El Usuario no tiene permisos");
            return res.status(409).json({ errors: error.message });
        }

        const { idArticle } = req.body;

        const article = await Article.findById(idArticle);
        if (!article) {
            const error = new Error("El Articulo no fue encontrado");
            return res.status(404).json({ errors: error.message });
        }

        if (article.active) {
            const error = new Error("El Articulo no ha sido eliminado");
            return res.status(400).json({ errors: error.message });
        }

        article.active = true;
        await article.save();

        res.send("Articulo activado correctamente");
    };
}
