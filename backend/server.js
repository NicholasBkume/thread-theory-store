import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import orderRoutes from "./routes/order.route.js";
import { stripeWebhook } from "./controllers/payment.controller.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";
import { apiRateLimit, corsPolicy, securityHeaders } from "./middleware/security.middleware.js";
import { logger } from "./lib/logger.js";
import { connectDB } from "./lib/db.js";

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(securityHeaders);
app.use(corsPolicy);

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use("/api/auth", apiRateLimit({ max: 60, keyPrefix: "auth" }), authRoutes);
app.use("/api/products", apiRateLimit({ max: 120, keyPrefix: "products" }), productRoutes);
app.use("/api/cart", apiRateLimit({ max: 120, keyPrefix: "cart" }), cartRoutes);
app.use("/api/coupons", apiRateLimit({ max: 60, keyPrefix: "coupons" }), couponRoutes);
app.use("/api/payments", apiRateLimit({ max: 30, keyPrefix: "payments" }), paymentRoutes);
app.use("/api/analytics", apiRateLimit({ max: 60, keyPrefix: "analytics" }), analyticsRoutes);
app.use("/api/orders", apiRateLimit({ max: 60, keyPrefix: "orders" }), orderRoutes);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        logger.info("Server started", { port: PORT, environment: process.env.NODE_ENV || "development" });
        connectDB();
    });
}
