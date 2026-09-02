import { describe, expect, it } from "vitest";
import Product from "../backend/models/product.model.js";

describe("Product model", () => {
    it("accepts a valid product", async () => {
        const product = new Product({
            name: "Classic Jacket",
            description: "Lightweight everyday jacket",
            price: 89.99,
            image: "https://example.com/jacket.jpg",
            category: "jackets",
        });

        await expect(product.validate()).resolves.toBeUndefined();
    });

    it("requires the core product fields", async () => {
        const product = new Product();

        await expect(product.validate()).rejects.toMatchObject({
            errors: expect.objectContaining({
                name: expect.anything(),
                description: expect.anything(),
                price: expect.anything(),
                image: expect.anything(),
                category: expect.anything(),
            }),
        });
    });

    it("rejects negative prices", async () => {
        const product = new Product({
            name: "Invalid Product",
            description: "Invalid price test",
            price: -1,
            image: "https://example.com/product.jpg",
            category: "test",
        });

        await expect(product.validate()).rejects.toMatchObject({
            errors: expect.objectContaining({
                price: expect.anything(),
            }),
        });
    });
});
