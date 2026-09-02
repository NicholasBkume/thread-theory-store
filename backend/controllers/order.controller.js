import mongoose from "mongoose";
import Order from "../models/order.model.js";

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

export const getAllOrders = async (_req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).populate("user", "name email");
        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

export const getOrderById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid order ID" });
        const order = await Order.findById(req.params.id).populate("user", "name email");
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }
        res.status(200).json({ order });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch order" });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const allowedStatuses = ["processing", "shipped", "delivered", "cancelled"];
        const { status } = req.body;
        if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "Invalid order status" });
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid order ID" });
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })
            .populate("user", "name email");
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.status(200).json({ order });
    } catch (error) {
        res.status(500).json({ message: "Failed to update order" });
    }
};
