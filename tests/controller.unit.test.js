import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    productFind: vi.fn(), productCreate: vi.fn(), productFindById: vi.fn(), productFindByIdAndDelete: vi.fn(), productAggregate: vi.fn(),
    redisGet: vi.fn(), redisSet: vi.fn(), redisDel: vi.fn(), couponFindOne: vi.fn(), couponFindOneAndUpdate: vi.fn(), couponFindOneAndDelete: vi.fn(),
    stripeCheckoutCreate: vi.fn(), stripeCouponsCreate: vi.fn(), stripeCheckoutRetrieve: vi.fn(), orderSave: vi.fn(),
}));
vi.mock("../backend/models/product.model.js", () => ({ default: { find: mocks.productFind, create: mocks.productCreate, findById: mocks.productFindById, findByIdAndDelete: mocks.productFindByIdAndDelete, aggregate: mocks.productAggregate } }));
vi.mock("../backend/models/coupon.model.js", () => ({ default: { findOne: mocks.couponFindOne, findOneAndUpdate: mocks.couponFindOneAndUpdate, findOneAndDelete: mocks.couponFindOneAndDelete } }));
vi.mock("../backend/models/order.model.js", () => ({ default: vi.fn().mockImplementation((data) => ({ ...data, save: mocks.orderSave })), create: mocks.orderSave, findOne: vi.fn() }));
vi.mock("../backend/lib/redis.js", () => ({ redis: { get: mocks.redisGet, set: mocks.redisSet, del: mocks.redisDel } }));
vi.mock("../backend/lib/cloudinary.js", () => ({ default: { uploader: { upload: vi.fn(), destroy: vi.fn() } } }));
vi.mock("../backend/lib/stripe.js", () => ({ stripe: { checkout: { sessions: { create: mocks.stripeCheckoutCreate, retrieve: mocks.stripeCheckoutRetrieve } }, coupons: { create: mocks.stripeCouponsCreate } } }));

import { createProduct, deleteProduct, getAllProducts, getFeaturedProducts, getProductById, getProductsByCategory } from "../backend/controllers/product.controller.js";
import { getCoupons, validateCoupon } from "../backend/controllers/coupon.controller.js";
import { createCheckoutSession } from "../backend/controllers/payment.controller.js";
import { addToCart, getCartProducts, removeAllFromCart, updateQuantity } from "../backend/controllers/cart.controller.js";

const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
beforeEach(() => {
    vi.clearAllMocks();
    mocks.redisGet.mockResolvedValue(null); mocks.redisSet.mockResolvedValue("OK"); mocks.redisDel.mockResolvedValue(1);
    mocks.productFind.mockResolvedValue([]); mocks.productFindByIdAndDelete.mockResolvedValue({}); mocks.productAggregate.mockResolvedValue([]);
    mocks.couponFindOne.mockResolvedValue(null); mocks.couponFindOneAndUpdate.mockResolvedValue(null); mocks.couponFindOneAndDelete.mockResolvedValue(null);
    mocks.stripeCheckoutCreate.mockResolvedValue({ id: "cs_test_123", url: "https://checkout.stripe.test/session" }); mocks.stripeCouponsCreate.mockResolvedValue({ id: "coupon_test" });
});

describe("product controllers", () => {
    it("returns all products", async () => { const products = [{ _id: "p1", name: "Jacket" }]; mocks.productFind.mockResolvedValue(products); const res = response(); await getAllProducts({}, res); expect(res.json).toHaveBeenCalledWith({ products }); });
    it("returns a product by id", async () => { const product = { _id: "p1", name: "Jacket" }; mocks.productFindById.mockResolvedValue(product); const res = response(); await getProductById({ params: { id: "p1" } }, res); expect(res.json).toHaveBeenCalledWith(product); });
    it("returns 404 when a product does not exist", async () => { mocks.productFindById.mockResolvedValue(null); const res = response(); await getProductById({ params: { id: "missing" } }, res); expect(res.status).toHaveBeenCalledWith(404); });
    it("filters products by category", async () => { const products = [{ name: "Jeans", category: "jeans" }]; mocks.productFind.mockResolvedValue(products); const res = response(); await getProductsByCategory({ params: { category: "jeans" } }, res); expect(mocks.productFind).toHaveBeenCalledWith({ category: "jeans" }); expect(res.json).toHaveBeenCalledWith({ products }); });
    it("uses Redis when featured products are cached", async () => { const products = [{ name: "Featured" }]; mocks.redisGet.mockResolvedValue(JSON.stringify(products)); const res = response(); await getFeaturedProducts({}, res); expect(mocks.productFind).not.toHaveBeenCalled(); expect(res.json).toHaveBeenCalledWith(products); });
    it("creates a product from the request body", async () => { const product = { _id: "p1", name: "Jacket" }; mocks.productCreate.mockResolvedValue(product); const res = response(); await createProduct({ body: { name: "Jacket", description: "Warm", price: 80, category: "jackets" } }, res); expect(mocks.productCreate).toHaveBeenCalledWith({ name: "Jacket", description: "Warm", price: 80, image: "", category: "jackets", stock: undefined }); expect(res.status).toHaveBeenCalledWith(201); });
    it("returns 404 when deleting a missing product", async () => { mocks.productFindById.mockResolvedValue(null); const res = response(); await deleteProduct({ params: { id: "missing" } }, res); expect(res.status).toHaveBeenCalledWith(404); });
});

describe("cart controllers", () => {
    it("adds a new product to the user's cart", async () => { const user = { cartItems: [], save: vi.fn().mockResolvedValue(undefined) }; const res = response(); await addToCart({ body: { productId: "p1" }, user }, res); expect(user.cartItems[0]).toMatchObject({ product: "p1", quantity: 1 }); expect(user.save).toHaveBeenCalledOnce(); });
    it("increments an existing cart item", async () => { const user = { cartItems: [{ product: "p1", quantity: 1 }], save: vi.fn().mockResolvedValue(undefined) }; await addToCart({ body: { productId: "p1" }, user }, response()); expect(user.cartItems[0].quantity).toBe(2); });
    it("removes one product when a product id is supplied", async () => { const user = { cartItems: [{ product: "p1", quantity: 1 }, { product: "p2", quantity: 1 }], save: vi.fn().mockResolvedValue(undefined) }; await removeAllFromCart({ body: { productId: "p1" }, user }, response()); expect(user.cartItems).toHaveLength(1); });
    it("clears the entire cart without a product id", async () => { const user = { cartItems: [{ product: "p1", quantity: 1 }], save: vi.fn().mockResolvedValue(undefined) }; await removeAllFromCart({ body: {}, user }, response()); expect(user.cartItems).toEqual([]); });
    it("updates quantity and removes an item at zero", async () => { const user = { cartItems: [{ product: "p1", quantity: 1 }], save: vi.fn().mockResolvedValue(undefined) }; await updateQuantity({ params: { id: "p1" }, body: { quantity: 3 }, user }, response()); expect(user.cartItems[0].quantity).toBe(3); await updateQuantity({ params: { id: "p1" }, body: { quantity: 0 }, user }, response()); expect(user.cartItems).toEqual([]); });
    it("returns cart products with quantities", async () => { const product = { id: "p1", name: "Jacket", toJSON: () => ({ id: "p1", name: "Jacket" }) }; mocks.productFind.mockResolvedValue([product]); const res = response(); await getCartProducts({ user: { cartItems: [{ product: "p1", quantity: 2 }] } }, res); expect(res.json).toHaveBeenCalledWith([{ id: "p1", name: "Jacket", quantity: 2 }]); });
});

describe("coupon controllers", () => {
    it("returns the active user coupon", async () => { const coupon = { code: "SAVE10" }; mocks.couponFindOne.mockResolvedValue(coupon); const res = response(); await getCoupons({ user: { _id: "u1" } }, res); expect(res.json).toHaveBeenCalledWith(coupon); });
    it("rejects an unknown coupon", async () => { const res = response(); await validateCoupon({ body: { code: "NOPE" }, user: { _id: "u1" } }, res); expect(res.status).toHaveBeenCalledWith(404); });
    it("accepts an active unexpired coupon", async () => { mocks.couponFindOne.mockResolvedValue({ code: "SAVE10", discountPercentage: 10, expirationDate: new Date(Date.now() + 86400000), save: vi.fn() }); const res = response(); await validateCoupon({ body: { code: "SAVE10" }, user: { _id: "u1" } }, res); expect(res.json).toHaveBeenCalledWith({ message: "Coupon is valid", code: "SAVE10", discountPercentage: 10 }); });
    it("deactivates an expired coupon", async () => { const coupon = { code: "OLD10", expirationDate: new Date(Date.now() - 86400000), isActive: true, save: vi.fn().mockResolvedValue(undefined) }; mocks.couponFindOne.mockResolvedValue(coupon); const res = response(); await validateCoupon({ body: { code: "OLD10" }, user: { _id: "u1" } }, res); expect(coupon.isActive).toBe(false); expect(res.status).toHaveBeenCalledWith(400); });
});

describe("Stripe checkout controller", () => {
    const dbProduct = (overrides = {}) => ({ _id: "p1", name: "Jacket", price: 25.5, image: "image.jpg", stock: 10, ...overrides });
    it("rejects an empty products array", async () => { const res = response(); await createCheckoutSession({ body: { products: [] }, user: { _id: "u1" } }, res); expect(res.status).toHaveBeenCalledWith(400); expect(mocks.stripeCheckoutCreate).not.toHaveBeenCalled(); });
    it("uses the database price instead of the client price", async () => { mocks.productFind.mockResolvedValue([dbProduct()]); const res = response(); await createCheckoutSession({ body: { products: [{ _id: "69a1b2c3d4e5f67890123456", price: 0.01, quantity: 2 }] }, user: { _id: "u1" } }, res); expect(mocks.stripeCheckoutCreate).toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith({ id: "cs_test_123", url: "https://checkout.stripe.test/session", totalAmount: 51 }); });
    it("rejects a product that does not exist", async () => { mocks.productFind.mockResolvedValue([]); const res = response(); await createCheckoutSession({ body: { products: [{ _id: "69a1b2c3d4e5f67890123456", quantity: 1 }] }, user: { _id: "u1" } }, res); expect(res.status).toHaveBeenCalledWith(400); expect(mocks.stripeCheckoutCreate).not.toHaveBeenCalled(); });
    it("rejects invalid quantities", async () => { const res = response(); await createCheckoutSession({ body: { products: [{ _id: "69a1b2c3d4e5f67890123456", quantity: 0 }] }, user: { _id: "u1" } }, res); expect(res.status).toHaveBeenCalledWith(400); });
    it("rejects checkout quantities above stock", async () => { mocks.productFind.mockResolvedValue([dbProduct({ stock: 1 })]); const res = response(); await createCheckoutSession({ body: { products: [{ _id: "69a1b2c3d4e5f67890123456", quantity: 2 }] }, user: { _id: "u1" } }, res); expect(res.status).toHaveBeenCalledWith(400); expect(mocks.stripeCheckoutCreate).not.toHaveBeenCalled(); });
    it("applies a valid coupon to the server-calculated total", async () => { mocks.productFind.mockResolvedValue([dbProduct({ price: 100 })]); mocks.couponFindOne.mockResolvedValue({ discountPercentage: 10, code: "SAVE10" }); const res = response(); await createCheckoutSession({ body: { products: [{ _id: "69a1b2c3d4e5f67890123456", quantity: 1 }], couponCode: "SAVE10" }, user: { _id: "u1" } }, res); expect(mocks.stripeCouponsCreate).toHaveBeenCalledWith({ percent_off: 10, duration: "once" }); expect(res.json).toHaveBeenCalledWith({ id: "cs_test_123", url: "https://checkout.stripe.test/session", totalAmount: 90 }); });
});
