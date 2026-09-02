import { beforeEach, describe, expect, it, vi } from "vitest";

const verify = vi.fn();
const findById = vi.fn();

vi.mock("jsonwebtoken", () => ({ default: { verify } }));
vi.mock("../backend/models/user.model.js", () => ({ default: { findById } }));

import { adminRoute, protectRoute } from "../backend/middleware/auth.middleware.js";

describe("auth middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects requests without an access token", async () => {
        const req = { cookies: {} };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        await protectRoute(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized - no access token" });
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects expired access tokens", async () => {
        verify.mockImplementation(() => {
            const error = new Error("expired");
            error.name = "TokenExpiredError";
            throw error;
        });

        const req = { cookies: { accessToken: "expired-token" } };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        await protectRoute(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized - access token expired" });
    });

    it("attaches the authenticated user and continues", async () => {
        const user = { _id: "user-1", role: "customer" };
        verify.mockReturnValue({ userId: "user-1" });
        findById.mockReturnValue({ select: vi.fn().mockResolvedValue(user) });

        const req = { cookies: { accessToken: "valid-token" } };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        await protectRoute(req, res, next);

        expect(req.user).toBe(user);
        expect(next).toHaveBeenCalledOnce();
    });

    it("rejects non-admin users", () => {
        const req = { user: { role: "customer" } };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        adminRoute(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Access denied - Admin only" });
        expect(next).not.toHaveBeenCalled();
    });

    it("allows admin users", () => {
        const req = { user: { role: "admin" } };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        adminRoute(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });
});
