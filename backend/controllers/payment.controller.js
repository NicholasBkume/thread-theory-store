import mongoose from "mongoose";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { stripe } from "../lib/stripe.js";

const normalizeAddress = (address) => {
    if (!address) return null;
    const required = ["name", "line1", "city", "state", "postalCode", "country"];
    if (required.some((field) => !address[field]?.toString().trim())) throw new Error("A complete shipping address is required");
    return Object.fromEntries(required.concat(["line2", "phone"]).filter((key) => address[key] !== undefined).map((key) => [key, address[key].toString().trim()]));
};

export const createCheckoutSession = async (req, res) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ message: "Stripe is not configured on the server." });
        const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`;
        const { products, couponCode, shippingAddress } = req.body;
        if (!Array.isArray(products) || products.length === 0) return res.status(400).json({ message: "Invalid or empty products array" });
        const address = normalizeAddress(shippingAddress);
        if (!address) return res.status(400).json({ message: "Shipping address is required" });
        const requestedProducts = products.map((product) => {
            const productId = product?._id || product?.id;
            const quantity = Number(product?.quantity);
            if (!productId || !mongoose.isValidObjectId(productId)) throw new Error("Invalid product id");
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new Error("Invalid product quantity");
            return { productId: productId.toString(), quantity };
        });
        const quantityByProduct = new Map();
        for (const item of requestedProducts) quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) || 0) + item.quantity);
        const ids = [...quantityByProduct.keys()];
        const databaseProducts = await Product.find({ _id: { $in: ids } });
        const productMap = new Map(databaseProducts.map((product) => [product._id.toString(), product]));
        if (productMap.size !== ids.length) throw new Error("One or more products are no longer available");
        for (const [id, quantity] of quantityByProduct) { const product = productMap.get(id); if (quantity > product.stock) throw new Error(`Insufficient stock for ${product.name}`); }
        const lineItems = requestedProducts.map(({ productId, quantity }) => { const product = productMap.get(productId); return { price_data: { currency: "usd", product_data: { name: product.name }, unit_amount: Math.round(Number(product.price) * 100) }, quantity }; });
        let totalAmount = lineItems.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);
        let coupon = null;
        if (couponCode) { coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true }); if (coupon) totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100); }
        const sessionParams = {
            payment_method_types: ["card"], line_items: lineItems, mode: "payment",
            success_url: `${clientUrl}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/purchase-cancel`,
            shipping_address_collection: { allowed_countries: [address.country.toUpperCase() || "US"] },
            metadata: { userId: req.user._id.toString(), couponCode: coupon?.code || "", shippingAddress: JSON.stringify(address), products: JSON.stringify(requestedProducts.map(({ productId, quantity }) => ({ id: productId, quantity, price: productMap.get(productId).price }))) }
        };
        if (coupon) sessionParams.discounts = [{ coupon: await createStripeCoupon(coupon.discountPercentage) }];
        const session = await stripe.checkout.sessions.create(sessionParams);
        return res.status(200).json({ id: session.id, url: session.url, totalAmount: totalAmount / 100 });
    } catch (error) { console.error("Error processing checkout:", error); return res.status(400).json({ message: error?.message || "Error processing checkout" }); }
};

export const checkoutSuccess = async (req, res) => {
    try { const { sessionId } = req.body; if (!sessionId) return res.status(400).json({ message: "sessionId is required" }); const session = await stripe.checkout.sessions.retrieve(sessionId); if (session.metadata?.userId !== req.user._id.toString()) return res.status(403).json({ message: "Checkout session does not belong to the current user." }); const order = await finalizePaidCheckout(session); if (!order) return res.status(400).json({ message: "Payment has not been completed." }); return res.status(200).json({ success: true, orderId: order._id }); }
    catch (error) { console.error("Error processing successful checkout:", error); return res.status(500).json({ message: error?.message || "Error processing successful checkout" }); }
};

export const stripeWebhook = async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(500).json({ message: "Stripe webhook is not configured on the server." });
    if (!signature) return res.status(400).json({ message: "Missing Stripe signature" });
    let event; try { event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET); } catch { return res.status(400).json({ message: "Invalid Stripe webhook signature" }); }
    try { if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) await finalizePaidCheckout(event.data.object); return res.status(200).json({ received: true }); }
    catch (error) { console.error("Error processing Stripe webhook:", error); return res.status(500).json({ message: "Webhook processing failed" }); }
};

export async function finalizePaidCheckout(session) {
    if (!session || session.payment_status !== "paid") return null;
    if (!session.id || !session.metadata?.userId || !session.metadata?.products) throw new Error("Stripe session is missing required order metadata");
    const existingOrder = await Order.findOne({ stripeSessionId: session.id }); if (existingOrder) return existingOrder;
    const products = JSON.parse(session.metadata.products); const quantityByProduct = new Map();
    for (const item of products) { if (!mongoose.isValidObjectId(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1) throw new Error("Stripe session contains invalid product metadata"); quantityByProduct.set(item.id, (quantityByProduct.get(item.id) || 0) + item.quantity); }
    const decremented = [];
    try {
        for (const [productId, quantity] of quantityByProduct) { const updated = await Product.findOneAndUpdate({ _id: productId, stock: { $gte: quantity } }, { $inc: { stock: -quantity } }, { new: true }); if (!updated) throw new Error(`Insufficient stock for product ${productId}`); decremented.push([productId, quantity]); }
        const shippingAddress = session.metadata.shippingAddress ? JSON.parse(session.metadata.shippingAddress) : undefined;
        const order = await Order.create({ user: session.metadata.userId, products: products.map((p) => ({ product: p.id, quantity: p.quantity, price: p.price })), totalAmount: Number(session.amount_total || 0) / 100, stripeSessionId: session.id, shippingAddress });
        if (session.metadata.couponCode) await Coupon.findOneAndUpdate({ code: session.metadata.couponCode, userId: session.metadata.userId }, { isActive: false });
        return order;
    } catch (error) {
        if (error?.code !== 11000) { for (const [productId, quantity] of decremented) await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } }); throw error; }
        return Order.findOne({ stripeSessionId: session.id });
    }
}

async function createStripeCoupon(discountPercentage) { const coupon = await stripe.coupons.create({ percent_off: discountPercentage, duration: "once" }); return coupon.id; }
