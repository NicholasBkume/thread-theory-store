import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";
import { mongo } from "mongoose";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({}); //find all products
        res.json({ products });
    } catch (error) {
        console.log("Error in get products controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getFeaturedProducts = async (req, res) => {
   try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }

    featuredProducts = await Product.find({ isFeatured: true }).lean();

    if (!featuredProducts) {
        return res.status(404).json({ message: "No featured products found" });
    }

    await redis.set("featured_products", JSON.stringify(featuredProducts));
    
    res.json(featuredProducts);

   } catch (error) {
    console.log("Error in get featured products controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
   }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;

            let cloudinaryResponse = null;

            if (image) {
                cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
            }

            const product = await Product.create({
                name,
                description,
                price,
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
      const { name, description, price, category, image } = req.body;
      const prod = await Product.findById(req.params.id);
      if (!prod) return res.status(404).json({ message: "Product not found" });
  
      // if a new base64-image string was sent, upload & delete old
      if (image && image !== prod.image) {
        // upload new
        const uploadRes = await cloudinary.uploader.upload(image, { folder: "products" });
        // delete old
        const publicId = prod.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`products/${publicId}`);
        prod.image = uploadRes.secure_url;
      }
  
      // update other fields
      if (name)        prod.name = name;
      if (description) prod.description = description;
      if (price)       prod.price = price;
      if (category)    prod.category = category;
  
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
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}
		res.json(product);
	} catch (error) {
		console.log("Error in get product by ID controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.image) {
        const publicId = product.image.split("/").pop().split(".")[0]; // Get the public ID of image
       try {
        await cloudinary.uploader.destroy(`products/${publicId}`); // Delete the image from Cloudinary
        console.log("Image deleted from Cloudinary");
       } catch (error) {
        console.log("Error deleting image from Cloudinary", error);
       }
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
        { 
            $sample: { size: 4 } 
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                price: 1,
                image: 1,
            } 
        }
    ])

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
        } else {
            res.status(404).json({ message: "Product not found" });
        }
        
    } catch (error) {
        console.log("Error in toggle featured product controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

async function updateFeaturedProductsCache() {
    try {
        //lean returns a plain js object instead of mongoose documents, improves performance
       const featuredProducts = await Product.find({ isFeatured: true }).lean(); 
       await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("Error in update featured products cache", error.message);
    }
};