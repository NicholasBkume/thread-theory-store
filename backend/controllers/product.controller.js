import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json({ products });
    } catch (error) {
        console.log("Error in get products controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getFeaturedProducts = async (req, res) => {
   try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) return res.json(JSON.parse(featuredProducts));

    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts) return res.status(404).json({ message: "No featured products found" });

    await redis.set("featured_products", JSON.stringify(featuredProducts));
    res.json(featuredProducts);
   } catch (error) {
    console.log("Error in get featured products controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
   }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category, stock } = req.body;
        const normalizedStock = stock === undefined ? 100 : Number(stock);
        if (!Number.isInteger(normalizedStock) || normalizedStock < 0) {
            return res.status(400).json({ message: "Stock must be a non-negative integer" });
        }

        let cloudinaryResponse = null;
        if (image) cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });

        const product = await Product.create({
            name,
            description,
            price,
            stock: normalizedStock,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
            category,
        });

        res.status(201).json(product);
    } catch (error) {
        console.log("Error in create product controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
      const { name, description, price, category, image, stock } = req.body;
      const prod = await Product.findById(req.params.id);
      if (!prod) return res.status(404).json({ message: "Product not found" });

      if (image && image !== prod.image) {
        const uploadRes = await cloudinary.uploader.upload(image, { folder: "products" });
        if (prod.image) {
          const publicId = prod.image.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`products/${publicId}`);
        }
        prod.image = uploadRes.secure_url;
      }

      if (name !== undefined) prod.name = name;
      if (description !== undefined) prod.description = description;
      if (price !== undefined) prod.price = price;
      if (category !== undefined) prod.category = category;
      if (stock !== undefined) {
        const normalizedStock = Number(stock);
        if (!Number.isInteger(normalizedStock) || normalizedStock < 0) {
          return res.status(400).json({ message: "Stock must be a non-negative integer" });
        }
        prod.stock = normalizedStock;
      }

      await prod.save();
      res.json({ product: prod });
    } catch (err) {
      console.error("Error in updateProduct controller", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  };

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        console.log("Error in get product by ID controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });

      if (product.image) {
        const publicId = product.image.split("/").pop().split(".")[0];
        try { await cloudinary.uploader.destroy(`products/${publicId}`); }
        catch (error) { console.log("Error deleting image from Cloudinary", error); }
      }

      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
       console.log("Error in delete product controller", error.message);
       res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getRecommendedProducts = async (req, res) => {
   try {
    const products = await Product.aggregate([
        { $sample: { size: 4 } },
        { $project: { _id: 1, name: 1, description: 1, price: 1, image: 1, stock: 1 } }
    ]);
    res.json(products);
   } catch (error) {
    console.log("Error in get recommended products controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
   }
};

export const getProductsByCategory = async (req, res) => {
    const { category } = req.params;
    try {
      const products = await Product.find({ category });
      res.json({ products });
    } catch (error) {
       console.log("Error in get products by category controller", error.message);
       res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updateFeaturedProductsCache();
            res.json(updatedProduct);
        } else res.status(404).json({ message: "Product not found" });
    } catch (error) {
        console.log("Error in toggle featured product controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

async function updateFeaturedProductsCache() {
    try {
       const featuredProducts = await Product.find({ isFeatured: true }).lean();
       await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("Error in update featured products cache", error.message);
    }
};