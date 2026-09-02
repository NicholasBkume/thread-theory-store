import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../backend/server.js";

describe("API health", () => {
    it("returns a successful health response", async () => {
        const response = await request(app).get("/api/health");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ok" });
    });

    it("returns 404 for an unknown API route", async () => {
        const response = await request(app).get("/api/does-not-exist");

        expect(response.status).toBe(404);
    });
});
