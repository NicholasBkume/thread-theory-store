import mongoose from "mongoose";
import Order from "../models/order.model.js";

export const getMyOrders = async (req, res) => {
    try { const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate("products.product", "name image"); res.status(200).json({ orders }); }
    catch { res.status(500).json({ message: "Failed to fetch orders" }); }
};
export const getAllOrders = async (_req, res) => {
    try { const orders = await Order.find().sort({ createdAt: -1 }).populate("user", "name email").populate("products.product", "name image"); res.status(200).json({ orders }); }
    catch { res.status(500).json({ message: "Failed to fetch orders" }); }
};
export const getOrderById = async (req, res) => {
    try { if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid order ID" }); const order = await Order.findById(req.params.id).populate("user", "name email").populate("products.product", "name image"); if (!order) return res.status(404).json({ message: "Order not found" }); if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Access denied" }); res.status(200).json({ order }); }
    catch { res.status(500).json({ message: "Failed to fetch order" }); }
};
export const updateOrderStatus = async (req, res) => {
    try {
        const allowedStatuses = ["processing", "shipped", "delivered", "cancelled", "refunded"];
        const { status, trackingNumber, carrier } = req.body;
        if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "Invalid order status" });
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid order ID" });
        const update = { status };
        if (trackingNumber !== undefined) update.trackingNumber = trackingNumber?.trim();
        if (carrier !== undefined) update.carrier = carrier?.trim();
        if (status === "shipped") update.shippedAt = new Date();
        if (status === "delivered") update.deliveredAt = new Date();
        if (status === "cancelled") update.cancelledAt = new Date();
        if (status === "refunded") { update.refundedAt = new Date(); update.paymentStatus = "refunded"; }
        const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).populate("user", "name email").populate("products.product", "name image");
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.status(200).json({ order });
    } catch { res.status(500).json({ message: "Failed to update order" }); }
};
