import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

export const createCheckoutSession = async (req, res) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error("Checkout configuration error: STRIPE_SECRET_KEY is missing");
            return res.status(500).json({ message: "Stripe is not configured on the server." });
        }

        const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`;
        const { products, couponCode } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Invalid or empty products array" });
        }

        const lineItems = products.map((product) => {
            const price = Number(product.price);
            const quantity = Number(product.quantity) || 1;

            if (!product.name || !Number.isFinite(price) || price <= 0 || quantity <= 0) {
                throw new Error(`Invalid product data for ${product.name || "unknown product"}`);
            }

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        ...(product.image ? { images: [product.image] } : {}),
                    },
                    unit_amount: Math.round(price * 100),
                },
                quantity,
            };
        });

        const subtotal = lineItems.reduce(
            (sum, item) => sum + item.price_data.unit_amount * item.quantity,
            0
        );
        let totalAmount = subtotal;

        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({
                code: couponCode,
                userId: req.user._id,
                isActive: true,
            });

            if (coupon) {
                totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
            }
        }

        const sessionParams = {
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${clientUrl}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/purchase-cancel`,
            metadata: {
                userId: req.user._id.toString(),
                couponCode: coupon?.code || "",
                products: JSON.stringify(
                    products.map((product) => ({
                        id: product._id,
                        quantity: Number(product.quantity) || 1,
                        price: Number(product.price),
                    }))
                ),
            },
        };

        if (coupon) {
            sessionParams.discounts = [
                {
                    coupon: await createStripeCoupon(coupon.discountPercentage),
                },
            ];
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        if (totalAmount >= 20000) {
            await createNewCoupon(req.user._id);
        }

        return res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
    } catch (error) {
        console.error("Error processing checkout:", error);
        return res.status(500).json({
            message: error?.message || "Error processing checkout",
        });
    }
};

export const checkoutSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            if (session.metadata.couponCode) {
                await Coupon.findOneAndUpdate(
                    {
                        code: session.metadata.couponCode,
                        userId: session.metadata.userId,
                    },
                    { isActive: false }
                );
            }

            const products = JSON.parse(session.metadata.products);
            const newOrder = new Order({
                user: session.metadata.userId,
                products: products.map((product) => ({
                    product: product.id,
                    quantity: product.quantity,
                    price: product.price,
                })),
                totalAmount: session.amount_total / 100,
                stripeSessionId: sessionId,
            });

            await newOrder.save();

            return res.status(200).json({
                success: true,
                message: "Payment successful, order created, and coupon deactivated if used.",
                orderId: newOrder._id,
            });
        }

        return res.status(400).json({ message: "Payment has not been completed." });
    } catch (error) {
        console.error("Error processing successful checkout:", error);
        return res.status(500).json({
            message: error?.message || "Error processing successful checkout",
        });
    }
};

async function createStripeCoupon(discountPercentage) {
    const coupon = await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: "once",
    });

    return coupon.id;
}

async function createNewCoupon(userId) {
    await Coupon.findOneAndDelete({ userId });

    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId,
    });

    await newCoupon.save();

    return newCoupon;
}
