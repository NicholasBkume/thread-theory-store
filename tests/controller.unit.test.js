import { beforeEach, describe, expect, it, vi } from "vitest";

const productFind = vi.fn();
const productCreate = vi.fn();
const productFindById = vi.fn();
const productFindByIdAndDelete = vi.fn();
const productAggregate = vi.fn();
const redisGet = vi.fn();
const redisSet = vi.fn();
const redisDel = vi.fn();
const couponFindOne = vi.fn();
const couponFindOneAndUpdate = vi.fn();
const couponFindOneAndDelete = vi.fn();
const stripeCheckoutCreate = vi.fn();
const stripeCouponsCreate = vi.fn();
const stripeCheckoutRetrieve = vi.fn();
const orderSave = vi.fn();

vi.mock("../backend/models/product.model.js", () => ({
    default: {
        find: productFind,
        create: productCreate,
        findById: productFindById,
        findByIdAndDelete: productFindByIdAndDelete,
        aggregate: productAggregate,
    },
}));
vi.mock("../backend/models/coupon.model.js", () => ({
    default: {
        findOne: couponFindOne,
        findOneAndUpdate: couponFindOneAndUpdate,
        findOneAndDelete: couponFindOneAndDelete,
    },
}));
vi.mock("../backend/models/order.model.js", () => ({
    default: vi.fn().mockImplementation((data) => ({ ...data, save: orderSave })),
    create: orderSave,
    findOne: vi.fn(),
}));
vi.mock("../backend/lib/redis.js", () => ({
    redis: { get: redisGet, set: redisSet, del: redisDel },
}));
vi.mock("../backend/lib/cloudinary.js", () => ({
    default: { uploader: { upload: vi.fn(), destroy: vi.fn() } },
}));
vi.mock("../backend/lib/stripe.js", () => ({
    stripe: {
        checkout: { sessions: { create: stripeCheckoutCreate, retrieve: stripeCheckoutRetrieve } },
        coupons: { create: stripeCouponsCreate },
    },
}));

import {
    createProduct,
    deleteProduct,
    getAllProducts,
    getFeaturedProducts,
    getProductById,
    getProductsByCategory,
} from "../backend/controllers/product.controller.js";
import { getCoupons, validateCoupon } from "../backend/controllers/coupon.controller.js";
import { createCheckoutSession } from "../backend/controllers/payment.controller.js";
import {
    addToCart,
    getCartProducts,
    removeAllFromCart,
    updateQuantity,
} from "../backend/controllers/cart.controller.js";

const response = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
});

beforeEach(() => {
    vi.clearAllMocks();
    redisGet.mockResolvedValue(null);
    redisSet.mockResolvedValue("OK");
    redisDel.mockResolvedValue(1);
    productFind.mockResolvedValue([]);
    productFindByIdAndDelete.mockResolvedValue({});
    productAggregate.mockResolvedValue([]);
    couponFindOne.mockResolvedValue(null);
    couponFindOneAndUpdate.mockResolvedValue(null);
    couponFindOneAndDelete.mockResolvedValue(null);
    stripeCheckoutCreate.mockResolvedValue({ id: "cs_test_123", url: "https://checkout.stripe.test/session" });
    stripeCouponsCreate.mockResolvedValue({ id: "coupon_test" });
});

describe("product controllers", () => {
    it("returns all products", async () => {
        const products = [{ _id: "p1", name: "Jacket" }];
        productFind.mockResolvedValue(products);
        const res = response();

        await getAllProducts({}, res);

        expect(res.json).toHaveBeenCalledWith({ products });
    });

    it("returns a product by id", async () => {
        const product = { _id: "p1", name: "Jacket" };
        productFindById.mockResolvedValue(product);
        const res = response();

        await getProductById({ params: { id: "p1" } }, res);

        expect(res.json).toHaveBeenCalledWith(product);
    });

    it("returns 404 when a product does not exist", async () => {
        productFindById.mockResolvedValue(null);
        const res = response();

        await getProductById({ params: { id: "missing" } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("filters products by category", async () => {
        const products = [{ name: "Jeans", category: "jeans" }];
        productFind.mockResolvedValue(products);
        const res = response();

        await getProductsByCategory({ params: { category: "jeans" } }, res);

        expect(productFind).toHaveBeenCalledWith({ category: "jeans" });
        expect(res.json).toHaveBeenCalledWith({ products });
    });

    it("uses Redis when featured products are cached", async () => {
        const products = [{ name: "Featured" }];
        redisGet.mockResolvedValue(JSON.stringify(products));
        const res = response();

        await getFeaturedProducts({}, res);

        expect(productFind).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(products);
    });

    it("creates a product from the request body", async () => {
        const product = { _id: "p1", name: "Jacket" };
        productCreate.mockResolvedValue(product);
        const res = response();

        await createProduct({ body: { name: "Jacket", description: "Warm", price: 80, category: "jackets" } }, res);

        expect(productCreate).toHaveBeenCalledWith({
            name: "Jacket",
            description: "Warm",
            price: 80,
            image: "",
            category: "jackets",
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(product);
    });

    it("returns 404 when deleting a missing product", async () => {
        productFindById.mockResolvedValue(null);
        const res = response();

        await deleteProduct({ params: { id: "missing" } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe("cart controllers", () => {
    it("adds a new product to the user's cart", async () => {
        const user = { cartItems: [], save: vi.fn().mockResolvedValue(undefined) };
        const res = response();

        await addToCart({ body: { productId: "p1" }, user }, res);

        expect(user.cartItems[0]).toMatchObject({ product: "p1", quantity: 1 });
        expect(user.save).toHaveBeenCalledOnce();
    });

    it("increments an existing cart item", async () => {
        const user = {
            cartItems: [{ product: "p1", quantity: 1 }],
            save: vi.fn().mockResolvedValue(undefined),
        };
        const res = response();

        await addToCart({ body: { productId: "p1" }, user }, res);

        expect(user.cartItems[0].quantity).toBe(2);
    });

    it("removes one product when a product id is supplied", async () => {
        const user = {
            cartItems: [
                { product: "p1", quantity: 1 },
                { product: "p2", quantity: 1 },
            ],
            save: vi.fn().mockResolvedValue(undefined),
        };
        const res = response();

        await removeAllFromCart({ body: { productId: "p1" }, user }, res);

        expect(user.cartItems).toHaveLength(1);
        expect(user.cartItems[0].product).toBe("p2");
    });

    it("clears the entire cart without a product id", async () => {
        const user = {
            cartItems: [{ product: "p1", quantity: 1 }],
            save: vi.fn().mockResolvedValue(undefined),
        };
        const res = response();

        await removeAllFromCart({ body: {}, user }, res);

        expect(user.cartItems).toEqual([]);
    });

    it("updates quantity and removes an item at zero", async () => {
        const user = {
            cartItems: [{ product: "p1", quantity: 1 }],
            save: vi.fn().mockResolvedValue(undefined),
        };
        const res = response();

        await updateQuantity({ params: { id: "p1" }, body: { quantity: 3 }, user }, res);
        expect(user.cartItems[0].quantity).toBe(3);

        await updateQuantity({ params: { id: "p1" }, body: { quantity: 0 }, user }, response());
        expect(user.cartItems).toEqual([]);
    });

    it("returns cart products with quantities", async () => {
        const product = { id: "p1", name: "Jacket", toJSON: () => ({ id: "p1", name: "Jacket" }) };
        productFind.mockResolvedValue([product]);
        const user = { cartItems: [{ product: "p1", quantity: 2 }] };
        const res = response();

        await getCartProducts({ user }, res);

        expect(res.json).toHaveBeenCalledWith([{ id: "p1", name: "Jacket", quantity: 2 }]);
    });
});

describe("coupon controllers", () => {
    it("returns the active user coupon", async () => {
        const coupon = { code: "SAVE10" };
        couponFindOne.mockResolvedValue(coupon);
        const res = response();

        await getCoupons({ user: { _id: "u1" } }, res);

        expect(couponFindOne).toHaveBeenCalledWith({ userId: "u1", isActive: true });
        expect(res.json).toHaveBeenCalledWith(coupon);
    });

    it("rejects an unknown coupon", async () => {
        const res = response();

        await validateCoupon({ body: { code: "NOPE" }, user: { _id: "u1" } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Coupon not found" });
    });

    it("accepts an active unexpired coupon", async () => {
        const coupon = {
            code: "SAVE10",
            discountPercentage: 10,
            expirationDate: new Date(Date.now() + 86400000),
            save: vi.fn(),
        };
        couponFindOne.mockResolvedValue(coupon);
        const res = response();

        await validateCoupon({ body: { code: "SAVE10" }, user: { _id: "u1" } }, res);

        expect(res.json).toHaveBeenCalledWith({
            message: "Coupon is valid",
            code: "SAVE10",
            discountPercentage: 10,
        });
    });

    it("deactivates an expired coupon", async () => {
        const coupon = {
            code: "OLD10",
            expirationDate: new Date(Date.now() - 86400000),
            isActive: true,
            save: vi.fn().mockResolvedValue(undefined),
        };
        couponFindOne.mockResolvedValue(coupon);
        const res = response();

        await validateCoupon({ body: { code: "OLD10" }, user: { _id: "u1" } }, res);

        expect(coupon.isActive).toBe(false);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("Stripe checkout controller", () => {
    const dbProduct = (overrides = {}) => ({
        _id: "p1",
        name: "Jacket",
        price: 25.5,
        image: "image.jpg",
        ...overrides,
    });

    it("rejects an empty products array", async () => {
        const res = response();

        await createCheckoutSession({ body: { products: [] }, user: { _id: "u1" } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid or empty products array" });
        expect(stripeCheckoutCreate).not.toHaveBeenCalled();
    });

    it("creates a checkout session using the database price instead of the client price", async () => {
        productFind.mockResolvedValue([dbProduct()]);
        const res = response();
        const req = {
            body: {
                products: [{ _id: "69a1b2c3d4e5f67890123456", name: "Forged Name", price: 0.01, image: "forged.jpg", quantity: 2 }],
            },
            user: { _id: "u1" },
        };

        await createCheckoutSession(req, res);

        expect(productFind).toHaveBeenCalledWith({ _id: { $in: ["69a1b2c3d4e5f67890123456"] } });
        expect(stripeCheckoutCreate).toHaveBeenCalledWith(expect.objectContaining({
            mode: "payment",
            line_items: [expect.objectContaining({
                quantity: 2,
                price_data: expect.objectContaining({
                    product_data: expect.objectContaining({ name: "Jacket", images: ["image.jpg"] }),
                    unit_amount: 2550,
                }),
            })],
            metadata: expect.objectContaining({
                userId: "u1",
                products: JSON.stringify([{ id: "69a1b2c3d4e5f67890123456", quantity: 2, price: 25.5 }]),
            }),
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            id: "cs_test_123",
            url: "https://checkout.stripe.test/session",
            totalAmount: 51,
        });
    });

    it("rejects a product that does not exist in the database", async () => {
        productFind.mockResolvedValue([]);
        const res = response();

        await createCheckoutSession({
            body: { products: [{ _id: "69a1b2c3d4e5f67890123456", price: 100, quantity: 1 }] },
            user: { _id: "u1" },
        }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "One or more products are no longer available" });
        expect(stripeCheckoutCreate).not.toHaveBeenCalled();
    });

    it("rejects invalid quantities", async () => {
        const res = response();

        await createCheckoutSession({
            body: { products: [{ _id: "69a1b2c3d4e5f67890123456", quantity: 0 }] },
            user: { _id: "u1" },
        }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid product quantity" });
        expect(productFind).not.toHaveBeenCalled();
        expect(stripeCheckoutCreate).not.toHaveBeenCalled();
    });

    it("applies a valid coupon to the server-calculated checkout total", async () => {
        productFind.mockResolvedValue([dbProduct({ price: 100 })]);
        couponFindOne.mockResolvedValue({ discountPercentage: 10, code: "SAVE10" });
        const res = response();

        await createCheckoutSession({
            body: { products: [{ _id: "69a1b2c3d4e5f67890123456", price: 1, quantity: 1 }], couponCode: "SAVE10" },
            user: { _id: "u1" },
        }, res);

        expect(stripeCouponsCreate).toHaveBeenCalledWith({ percent_off: 10, duration: "once" });
        expect(res.json).toHaveBeenCalledWith({
            id: "cs_test_123",
            url: "https://checkout.stripe.test/session",
            totalAmount: 90,
        });
    });
});
