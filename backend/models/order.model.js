import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    name: { type: String, trim: true, required: true },
    line1: { type: String, trim: true, required: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    postalCode: { type: String, trim: true, required: true },
    country: { type: String, trim: true, required: true, default: "US" },
    phone: { type: String, trim: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        variantId: { type: mongoose.Schema.Types.ObjectId },
    }],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["processing", "shipped", "delivered", "cancelled", "refunded"], default: "processing" },
    paymentStatus: { type: String, enum: ["pending", "paid", "refunded", "partially_refunded"], default: "paid" },
    shippingAddress: { type: addressSchema },
    trackingNumber: { type: String, trim: true },
    carrier: { type: String, trim: true },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    refundedAt: { type: Date },
    refundId: { type: String, trim: true },
    stockRestoredAt: { type: Date },
    stripeSessionId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ trackingNumber: 1 });
orderSchema.index({ refundId: 1 }, { sparse: true });

export default mongoose.model("Order", orderSchema);
