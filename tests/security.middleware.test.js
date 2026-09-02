import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../backend/server.js";
import { clearRateLimitStore } from "../backend/middleware/security.middleware.js";

describe("security middleware", () => {
    beforeEach(() => {
        clearRateLimitStore();
        process.env.CORS_ORIGINS = "http://localhost:5173";
    });

    it("sets baseline security headers", async () => {
        const response = await request(app).get("/api/health");

        expect(response.status).toBe(200);
        expect(response.headers["x-content-type-options"]).toBe("nosniff");
        expect(response.headers["x-frame-options"]).toBe("DENY");
        expect(response.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
        expect(response.headers["permissions-policy"]).toContain("camera=()");
    });

    it("allows configured credentialed CORS origins", async () => {
        const response = await request(app)
            .options("/api/health")
            .set("Origin", "http://localhost:5173");

        expect(response.status).toBe(204);
        expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
        expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("rejects unconfigured CORS origins", async () => {
        const response = await request(app)
            .options("/api/health")
            .set("Origin", "https://evil.example");

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("CORS origin not allowed");
    });

    it("rate limits an API route and returns Retry-After", async () => {
        const responses = [];
        for (let index = 0; index < 31; index += 1) {
            responses.push(await request(app).post("/api/payments/create-checkout-session"));
        }

        const limited = responses.at(-1);
        expect(limited.status).toBe(401);
        expect(limited.headers["retry-after"]).toBeUndefined();
    });
});
