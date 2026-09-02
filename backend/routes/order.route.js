import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { getMyOrders, getAllOrders, getOrderById, updateOrderStatus, cancelMyOrder } from "../controllers/order.controller.js";

const router = express.Router();
router.get("/", protectRoute, getMyOrders);
router.get("/admin", protectRoute, adminRoute, getAllOrders);
router.post("/:id/cancel", protectRoute, cancelMyOrder);
router.get("/:id", protectRoute, getOrderById);
router.patch("/:id/status", protectRoute, adminRoute, updateOrderStatus);
export default router;
