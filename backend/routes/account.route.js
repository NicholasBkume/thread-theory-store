import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { updateProfile, getWishlist, toggleWishlist, addAddress, deleteAddress, createReview, getProductReviews } from "../controllers/account.controller.js";

const router = express.Router();
router.use(protectRoute);
router.patch("/profile", updateProfile);
router.get("/wishlist", getWishlist);
router.patch("/wishlist/:productId", toggleWishlist);
router.post("/addresses", addAddress);
router.delete("/addresses/:addressId", deleteAddress);
router.post("/reviews/:productId", createReview);
router.get("/reviews/:productId", getProductReviews);
export default router;
