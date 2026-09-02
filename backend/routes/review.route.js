import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { getAdminReviews, moderateReview, deleteReview } from "../controllers/review.controller.js";

const router = express.Router();
router.use(protectRoute, adminRoute);
router.get("/", getAdminReviews);
router.patch("/:id", moderateReview);
router.delete("/:id", deleteReview);
export default router;
