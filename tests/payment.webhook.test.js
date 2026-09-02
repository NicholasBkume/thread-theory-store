import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    constructEvent: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
}));

vi.mock("../backend/lib/stripe.js", () => ({
    stripe: {
        webhooks: {
            constructEvent: mocks.constructEvent,
        },
        checkout: {
            sessions: {
                retrieve: vi.fn(),
            },
        },
    },
}));

vi.mock("../backend/models/order.model.js", () => ({
    default: {
        findOne: mocks.findOne,
        create: mocks.create,
    },
}));

vi.mock("../backend/models/coupon.model.js", () => ({
    default: {
        findOneAndUpdate: mocks.findOneAndUpdate,
    },
}));

import { finalizePaidCheckout, stripeWebhook } from "../backend/controllers/payment.controller.js";

describe("Stripe webhook and order finalization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    });

    const paidSession = {
        id: "cs_test_123",
        payment_status: "paid",
        amount_total: 12500,
        metadata: {
            userId: "user123",
            couponCode: "SAVE10",
            products: JSON.stringify([
                { id: "product123", quantity: 2, price: 62.5 },
            ]),
        },
    };

    it("rejects requests without a Stripe signature", async () => {
        const req = { headers: {}, body: Buffer.from("{}") };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        await stripeWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.constructEvent).not.toHaveBeenCalled();
    });

    it("rejects invalid Stripe signatures", async () => {
        mocks.constructEvent.mockImplementation(() => {
            throw new Error("signature mismatch");
        });

        const req = {
            headers: { "stripe-signature": "bad" },
            body: Buffer.from("{}"),
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        await stripeWebhook(req, res);

        expect(mocks.constructEvent).toHaveBeenCalledWith(req.body, "bad", "whsec_test");
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("finalizes a paid checkout and deactivates its coupon", async () => {
        mocks.findOne.mockResolvedValue(null);
        const savedOrder = { _id: "order123" };
        mocks.create.mockResolvedValue(savedOrder);
        mocks.findOneAndUpdate.mockResolvedValue({});

        const order = await finalizePaidCheckout(paidSession);

        expect(mocks.create).toHaveBeenCalledWith({
            user: "user123",
            products: [{ product: "product123", quantity: 2, price: 62.5 }],
            totalAmount: 125,
            stripeSessionId: "cs_test_123",
        });
        expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
            { code: "SAVE10", userId: "user123" },
            { isActive: false }
        );
        expect(order).toBe(savedOrder);
    });

    it("is idempotent when Stripe sends the same checkout more than once", async () => {
        const existingOrder = { _id: "existing-order" };
        mocks.findOne.mockResolvedValue(existingOrder);

        const order = await finalizePaidCheckout(paidSession);

        expect(order).toBe(existingOrder);
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("does not create an order for unpaid sessions", async () => {
        const unpaidSession = { ...paidSession, payment_status: "unpaid" };

        await expect(finalizePaidCheckout(unpaidSession)).resolves.toBeNull();
        expect(mocks.findOne).not.toHaveBeenCalled();
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it("acknowledges a verified checkout.session.completed event", async () => {
        mocks.constructEvent.mockReturnValue({
            type: "checkout.session.completed",
            data: { object: paidSession },
        });
        mocks.findOne.mockResolvedValue({ _id: "existing-order" });

        const req = {
            headers: { "stripe-signature": "valid" },
            body: Buffer.from("raw-stripe-payload"),
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        await stripeWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ received: true });
    });
});
