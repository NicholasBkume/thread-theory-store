import express from "express";
import { getCoupons, validateCoupon } from "../controllers/coupon.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getCoupons);
router.post("/validate", protectRoute, validateCoupon);

export default router;