import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { stripe } from "../lib/stripe.js";

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
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (trackingNumber !== undefined) order.trackingNumber = trackingNumber?.trim();
        if (carrier !== undefined) order.carrier = carrier?.trim();
        if (status === "refunded" && order.paymentStatus !== "refunded") await refundOrderPayment(order);
        if (status === "cancelled" && order.status !== "cancelled") await restoreOrderStock(order);
        order.status = status;
        if (status === "shipped") order.shippedAt = new Date();
        if (status === "delivered") order.deliveredAt = new Date();
        if (status === "cancelled") order.cancelledAt = new Date();
        if (status === "refunded") { order.refundedAt = new Date(); order.paymentStatus = "refunded"; }
        await order.save();
        await order.populate("user", "name email");
        await order.populate("products.product", "name image");
        res.status(200).json({ order });
    } catch (error) { res.status(500).json({ message: error?.message || "Failed to update order" }); }
};

export const cancelMyOrder = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid order ID" });
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.status !== "processing") return res.status(400).json({ message: "Only processing orders can be cancelled" });
        if (order.paymentStatus === "paid") await refundOrderPayment(order);
        await restoreOrderStock(order);
        order.status = "cancelled";
        order.cancelledAt = new Date();
        order.paymentStatus = order.paymentStatus === "paid" ? "refunded" : order.paymentStatus;
        await order.save();
        res.json({ message: "Order cancelled and refund initiated", order });
    } catch (error) { res.status(500).json({ message: error?.message || "Failed to cancel order" }); }
};

async function restoreOrderStock(order) {
    for (const item of order.products) if (item.product) await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
}

async function refundOrderPayment(order) {
    if (!order.stripeSessionId) throw new Error("This order has no Stripe payment session");
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured on the server");
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    const paymentIntent = session.payment_intent;
    if (!paymentIntent) throw new Error("Stripe payment intent is unavailable for this order");
    await stripe.refunds.create({ payment_intent: paymentIntent });
}
