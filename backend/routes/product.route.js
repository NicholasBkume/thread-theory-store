import express from "express";
import { 
    createProduct, 
    deleteProduct, 
    getAllProducts, 
    getFeaturedProducts,
    getRecommendedProducts,
    getProductsByCategory,
    toggleFeaturedProduct, 
    updateProduct, 
    getProductById
} from "../controllers/product.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecommendedProducts);
router.get("/:id", protectRoute, adminRoute, getProductById);
router.post("/", protectRoute, adminRoute, createProduct);
router.patch("/:id/feature", protectRoute, adminRoute, toggleFeaturedProduct);
router.put("/:id", protectRoute, adminRoute, updateProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default router;