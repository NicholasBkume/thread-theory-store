import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeVariants = (variants) => {
    if (!Array.isArray(variants)) return [];
    return variants.map((variant) => ({ ...variant, stock: Math.max(0, Number(variant.stock || 0)) }));
};
const aggregateStock = (variants, fallback) => variants.length ? variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0) : fallback;

export const getAllProducts = async (req, res) => {
    try {
        const { search = "", category, minPrice, maxPrice, sort = "featured", inStock, page = "1", pageSize = "24" } = req.query;
        const filter = {};
        const q = search.trim().slice(0, 100);
        if (q) filter.$or = [{ name: { $regex: escapeRegex(q), $options: "i" } }, { description: { $regex: escapeRegex(q), $options: "i" } }];
        if (category) filter.category = category;
        if (inStock === "true") filter.stock = { $gt: 0 };
        if (inStock === "false") filter.stock = 0;
        const min = Number(minPrice), max = Number(maxPrice);
        if (Number.isFinite(min) || Number.isFinite(max)) {
            filter.price = {};
            if (Number.isFinite(min)) filter.price.$gte = Math.max(0, min);
            if (Number.isFinite(max)) filter.price.$lte = Math.max(0, max);
            if (filter.price.$gte !== undefined && filter.price.$lte !== undefined && filter.price.$gte > filter.price.$lte) return res.status(400).json({ message: "Minimum price cannot exceed maximum price" });
        }
        const sorts = { featured: { isFeatured: -1, createdAt: -1 }, newest: { createdAt: -1 }, oldest: { createdAt: 1 }, price_asc: { price: 1 }, price_desc: { price: -1 }, name_asc: { name: 1 }, name_desc: { name: -1 } };
        const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
        const safePageSize = Math.min(48, Math.max(1, Number.parseInt(pageSize, 10) || 24));
        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter).sort(sorts[sort] || sorts.featured).skip((safePage - 1) * safePageSize).limit(safePageSize).lean();
        res.json({ products, pagination: { page: safePage, pageSize: safePageSize, total, totalPages: Math.max(1, Math.ceil(total / safePageSize)) } });
    } catch (error) { console.error("Error in get products controller", error); res.status(500).json({ message: "Server error" }); }
};
export const getFeaturedProducts = async (_req, res) => { try { let cached = await redis.get("featured_products"); if (cached) return res.json(JSON.parse(cached)); const products = await Product.find({ isFeatured: true }).lean(); await redis.set("featured_products", JSON.stringify(products)); res.json(products); } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); } };
export const createProduct = async (req, res) => { try { const { name, description, price, image, category, stock, lowStockThreshold, variants } = req.body; const normalizedStock = stock === undefined ? 100 : Number(stock); if (!Number.isInteger(normalizedStock) || normalizedStock < 0) return res.status(400).json({ message: "Stock must be a non-negative integer" }); const normalizedVariants = normalizeVariants(variants); if (normalizedVariants.some(v => !Number.isInteger(v.stock) || v.stock < 0)) return res.status(400).json({ message: "Variant stock must be a non-negative integer" }); let cloudinaryResponse = null; if (image) cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" }); const product = await Product.create({ name, description, price, stock: aggregateStock(normalizedVariants, normalizedStock), lowStockThreshold, variants: normalizedVariants, image: cloudinaryResponse?.secure_url || "", category }); await redis.del("featured_products"); res.status(201).json(product); } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); } };
export const updateProduct = async (req, res) => { try { const { name, description, price, category, image, stock, lowStockThreshold, variants } = req.body; const prod = await Product.findById(req.params.id); if (!prod) return res.status(404).json({ message: "Product not found" }); if (image && image !== prod.image) { const uploadRes = await cloudinary.uploader.upload(image, { folder: "products" }); if (prod.image) { const publicId = prod.image.split("/").pop().split(".")[0]; await cloudinary.uploader.destroy(`products/${publicId}`); } prod.image = uploadRes.secure_url; } if (name !== undefined) prod.name = name; if (description !== undefined) prod.description = description; if (price !== undefined) prod.price = price; if (category !== undefined) prod.category = category; if (variants !== undefined) { const normalizedVariants = normalizeVariants(variants); if (normalizedVariants.some(v => !Number.isInteger(v.stock) || v.stock < 0)) return res.status(400).json({ message: "Variant stock must be a non-negative integer" }); prod.variants = normalizedVariants; prod.stock = aggregateStock(normalizedVariants, Number(stock ?? prod.stock)); } else if (stock !== undefined) { const value = Number(stock); if (!Number.isInteger(value) || value < 0) return res.status(400).json({ message: "Stock must be a non-negative integer" }); prod.stock = value; } if (lowStockThreshold !== undefined) { const value = Number(lowStockThreshold); if (!Number.isInteger(value) || value < 0) return res.status(400).json({ message: "Low-stock threshold must be a non-negative integer" }); prod.lowStockThreshold = value; } await prod.save(); await redis.del("featured_products"); res.json({ product: prod }); } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); } };
export const getProductById = async (req, res) => { try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ message: "Product not found" }); res.json(product); } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); } };
export const deleteProduct = async (req, res) => { try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ message: "Product not found" }); if (product.image) { const publicId = product.image.split("/").pop().split(".")[0]; try { await cloudinary.uploader.destroy(`products/${publicId}`); } catch {} } await Product.findByIdAndDelete(req.params.id); await redis.del("featured_products"); res.json({ message: "Product deleted successfully" }); } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); } };
export const getRecommendedProducts = async (req, res) => { try { const category = req.query.category?.trim(); const filter = category ? { category } : {}; const products = await Product.find(filter).sort({ isFeatured: -1, createdAt: -1 }).limit(4).lean(); res.json(products); } catch (error) { res.status(500).json({ message: "Server error" }); } };
export const getProductsByCategory = async (req, res) => { try { res.json({ products: await Product.find({ category: req.params.category }).sort({ isFeatured: -1, createdAt: -1 }) }); } catch (error) { res.status(500).json({ message: "Server error" }); } };
export const toggleFeaturedProduct = async (req, res) => { try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ message: "Product not found" }); product.isFeatured = !product.isFeatured; const updatedProduct = await product.save(); await redis.del("featured_products"); res.json(updatedProduct); } catch (error) { res.status(500).json({ message: "Server error" }); } };
