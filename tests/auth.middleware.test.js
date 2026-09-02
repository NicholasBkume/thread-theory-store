import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ verify: vi.fn(), findById: vi.fn() }));
vi.mock("jsonwebtoken", () => ({ default: { verify: mocks.verify } }));
vi.mock("../backend/models/user.model.js", () => ({ default: { findById: mocks.findById } }));

import { adminRoute, protectRoute } from "../backend/middleware/auth.middleware.js";

describe("auth middleware", () => {
    beforeEach(() => vi.clearAllMocks());
    it("rejects requests without an access token", async () => { const req = { cookies: {} }; const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }; const next = vi.fn(); await protectRoute(req, res, next); expect(res.status).toHaveBeenCalledWith(401); expect(next).not.toHaveBeenCalled(); });
    it("rejects expired access tokens", async () => { mocks.verify.mockImplementation(() => { const error = new Error("expired"); error.name = "TokenExpiredError"; throw error; }); const req = { cookies: { accessToken: "expired-token" } }; const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }; await protectRoute(req, res, vi.fn()); expect(res.status).toHaveBeenCalledWith(401); expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized - access token expired" }); });
    it("attaches the authenticated user and continues", async () => { const user = { _id: "user-1", role: "customer" }; mocks.verify.mockReturnValue({ userId: "user-1" }); mocks.findById.mockReturnValue({ select: vi.fn().mockResolvedValue(user) }); const req = { cookies: { accessToken: "valid-token" } }; const next = vi.fn(); await protectRoute(req, { status: vi.fn().mockReturnThis(), json: vi.fn() }, next); expect(req.user).toBe(user); expect(next).toHaveBeenCalledOnce(); });
    it("rejects non-admin users", () => { const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }; const next = vi.fn(); adminRoute({ user: { role: "customer" } }, res, next); expect(res.status).toHaveBeenCalledWith(403); expect(next).not.toHaveBeenCalled(); });
    it("allows admin users", () => { const next = vi.fn(); adminRoute({ user: { role: "admin" } }, { status: vi.fn().mockReturnThis(), json: vi.fn() }, next); expect(next).toHaveBeenCalledOnce(); });
});
