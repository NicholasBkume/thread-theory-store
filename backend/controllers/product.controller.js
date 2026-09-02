import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
    try {
        const { search = "", category, minPrice, maxPrice, sort = "featured", inStock } = req.query;
        const filter = {};
        const q = search.trim();
        if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }];
        if (category) filter.category = category;
        if (inStock === "true") filter.stock = { $gt: 0 };
        if (inStock === "false") filter.stock = 0;
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (Number.isFinite(Number(minPrice))) filter.price.$gte = Number(minPrice);
            if (Number.isFinite(Number(maxPrice))) filter.price.$lte = Number(maxPrice);
        }
        const sorts = { featured: { isFeatured: -1, createdAt: -1 }, newest: { createdAt: -1 }, oldest: { createdAt: 1 }, price_asc: { price: 1 }, price_desc: { price: -1 }, name_asc: { name: 1 }, name_desc: { name: -1 } };
        res.json({ products: await Product.find(filter).sort(sorts[sort] || sorts.featured) });
    } catch (error) { console.error("Error in get products controller", error); res.status(500).json({ message: "Server error" }); }
};

export const getFeaturedProducts = async (req, res) => {
   try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) return res.json(JSON.parse(featuredProducts));
    featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
    res.json(featuredProducts);
   } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category, stock, lowStockThreshold, variants } = req.body;
        const normalizedStock = stock === undefined ? 100 : Number(stock);
        if (!Number.isInteger(normalizedStock) || normalizedStock < 0) return res.status(400).json({ message: "Stock must be a non-negative integer" });
        let cloudinaryResponse = null;
        if (image) cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
        const product = await Product.create({ name, description, price, stock: normalizedStock, lowStockThreshold, variants, image: cloudinaryResponse?.secure_url || "", category });
        await redis.del("featured_products");
        res.status(201).json(product);
    } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

export const updateProduct = async (req, res) => {
    try {
      const { name, description, price, category, image, stock, lowStockThreshold, variants } = req.body;
      const prod = await Product.findById(req.params.id);
      if (!prod) return res.status(404).json({ message: "Product not found" });
      if (image && image !== prod.image) {
        const uploadRes = await cloudinary.uploader.upload(image, { folder: "products" });
        if (prod.image) { const publicId = prod.image.split("/").pop().split(".")[0]; await cloudinary.uploader.destroy(`products/${publicId}`); }
        prod.image = uploadRes.secure_url;
      }
      if (name !== undefined) prod.name = name;
      if (description !== undefined) prod.description = description;
      if (price !== undefined) prod.price = price;
      if (category !== undefined) prod.category = category;
      if (stock !== undefined) { const value = Number(stock); if (!Number.isInteger(value) || value < 0) return res.status(400).json({ message: "Stock must be a non-negative integer" }); prod.stock = value; }
      if (lowStockThreshold !== undefined) { const value = Number(lowStockThreshold); if (!Number.isInteger(value) || value < 0) return res.status(400).json({ message: "Low-stock threshold must be a non-negative integer" }); prod.lowStockThreshold = value; }
      if (variants !== undefined) prod.variants = variants;
      await prod.save(); await redis.del("featured_products"); res.json({ product: prod });
    } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

export const getProductById = async (req, res) => {
    try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ message: "Product not found" }); res.json(product); }
    catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

export const deleteProduct = async (req, res) => {
    try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ message: "Product not found" }); if (product.image) { const publicId = product.image.split("/").pop().split(".")[0]; try { await cloudinary.uploader.destroy(`products/${publicId}`); } catch {} } await Product.findByIdAndDelete(req.params.id); await redis.del("featured_products"); res.json({ message: "Product deleted successfully" }); }
    catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

export const getRecommendedProducts = async (req, res) => {
   try { res.json(await Product.aggregate([{ $sample: { size: 4 } }, { $project: { _id: 1, name: 1, description: 1, price: 1, image: 1, stock: 1 } }])); }
   catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

export const getProductsByCategory = async (req, res) => {
    try { res.json({ products: await Product.find({ category: req.params.category }).sort({ isFeatured: -1, createdAt: -1 }) }); }
    catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

export const toggleFeaturedProduct = async (req, res) => {
    try { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ message: "Product not found" }); product.isFeatured = !product.isFeatured; const updatedProduct = await product.save(); await redis.del("featured_products"); res.json(updatedProduct); }
    catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};
