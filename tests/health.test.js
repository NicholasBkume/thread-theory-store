import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../backend/server.js";

describe("API health and protected routes", () => {
    it("returns a successful health response", async () => {
        const response = await request(app).get("/api/health");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ok" });
    });

    it("returns a consistent JSON 404 for an unknown API route", async () => {
        const response = await request(app).get("/api/does-not-exist");
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Route not found: GET /api/does-not-exist" });
    });

    it.each([
        ["products", "/api/products"],
        ["product by id", "/api/products/507f1f77bcf86cd799439011"],
        ["cart", "/api/cart"],
        ["coupons", "/api/coupons"],
        ["analytics", "/api/analytics"],
        ["orders", "/api/orders"],
        ["admin orders", "/api/orders/admin"],
    ])("rejects unauthenticated %s requests", async (_name, route) => {
        const response = await request(app).get(route);
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/^Unauthorized/);
    });

    it("rejects unauthenticated checkout requests", async () => {
        const response = await request(app)
            .post("/api/payments/create-checkout-session")
            .send({ products: [{ name: "Jacket", price: 25, quantity: 1 }] });
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/^Unauthorized/);
    });
});
