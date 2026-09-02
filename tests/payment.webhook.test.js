import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    constructEvent: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
}));

vi.mock("../backend/lib/stripe.js", () => ({
    stripe: {
        webhooks: { constructEvent: mocks.constructEvent },
        checkout: { sessions: { retrieve: vi.fn() } },
    },
}));

vi.mock("../backend/models/order.model.js", () => ({ default: { findOne: mocks.findOne, create: mocks.create } }));
vi.mock("../backend/models/product.model.js", () => ({ default: { findOneAndUpdate: mocks.findOneAndUpdate, findByIdAndUpdate: mocks.findByIdAndUpdate } }));
vi.mock("../backend/models/coupon.model.js", () => ({ default: { findOneAndUpdate: vi.fn() } }));

import { finalizePaidCheckout, stripeWebhook } from "../backend/controllers/payment.controller.js";

describe("Stripe webhook and order finalization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
        mocks.findOneAndUpdate.mockResolvedValue({ _id: "product123", stock: 8 });
    });

    const paidSession = {
        id: "cs_test_123",
        payment_status: "paid",
        amount_total: 12500,
        metadata: {
            userId: "507f1f77bcf86cd799439011",
            couponCode: "SAVE10",
            products: JSON.stringify([{ id: "507f1f77bcf86cd799439012", quantity: 2, price: 62.5 }]),
        },
    };

    it("rejects requests without a Stripe signature", async () => {
        const req = { headers: {}, body: Buffer.from("{}") };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
        await stripeWebhook(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.constructEvent).not.toHaveBeenCalled();
    });

    it("rejects invalid Stripe signatures", async () => {
        mocks.constructEvent.mockImplementation(() => { throw new Error("signature mismatch"); });
        const req = { headers: { "stripe-signature": "bad" }, body: Buffer.from("{}") };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
        await stripeWebhook(req, res);
        expect(mocks.constructEvent).toHaveBeenCalledWith(req.body, "bad", "whsec_test");
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("atomically decrements inventory before creating the order", async () => {
        mocks.findOne.mockResolvedValue(null);
        const savedOrder = { _id: "order123" };
        mocks.create.mockResolvedValue(savedOrder);
        const order = await finalizePaidCheckout(paidSession);

        expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: "507f1f77bcf86cd799439012", stock: { $gte: 2 } },
            { $inc: { stock: -2 } },
            { new: true }
        );
        expect(mocks.create).toHaveBeenCalledWith({
            user: "507f1f77bcf86cd799439011",
            products: [{ product: "507f1f77bcf86cd799439012", quantity: 2, price: 62.5 }],
            totalAmount: 125,
            stripeSessionId: "cs_test_123",
        });
        expect(order).toBe(savedOrder);
    });

    it("rejects paid checkout when inventory cannot be reserved", async () => {
        mocks.findOne.mockResolvedValue(null);
        mocks.findOneAndUpdate.mockResolvedValue(null);
        await expect(finalizePaidCheckout(paidSession)).rejects.toThrow("Insufficient stock");
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it("is idempotent when Stripe sends the same checkout more than once", async () => {
        const existingOrder = { _id: "existing-order" };
        mocks.findOne.mockResolvedValue(existingOrder);
        const order = await finalizePaidCheckout(paidSession);
        expect(order).toBe(existingOrder);
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("restores inventory if order creation fails", async () => {
        mocks.findOne.mockResolvedValue(null);
        mocks.create.mockRejectedValue(new Error("database unavailable"));
        await expect(finalizePaidCheckout(paidSession)).rejects.toThrow("database unavailable");
        expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith(
            "507f1f77bcf86cd799439012",
            { $inc: { stock: 2 } }
        );
    });

    it("does not create an order for unpaid sessions", async () => {
        const unpaidSession = { ...paidSession, payment_status: "unpaid" };
        await expect(finalizePaidCheckout(unpaidSession)).resolves.toBeNull();
        expect(mocks.findOne).not.toHaveBeenCalled();
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it("acknowledges a verified checkout.session.completed event", async () => {
        mocks.constructEvent.mockReturnValue({ type: "checkout.session.completed", data: { object: paidSession } });
        mocks.findOne.mockResolvedValue({ _id: "existing-order" });
        const req = { headers: { "stripe-signature": "valid" }, body: Buffer.from("raw-stripe-payload") };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
        await stripeWebhook(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ received: true });
    });
});
