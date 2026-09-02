import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    findOne: vi.fn(), create: vi.fn(), redisSet: vi.fn(), redisGet: vi.fn(), redisDel: vi.fn(), jwtSign: vi.fn(), jwtVerify: vi.fn(),
}));

vi.mock("../backend/models/user.model.js", () => ({ default: { findOne: mocks.findOne, create: mocks.create } }));
vi.mock("../backend/lib/redis.js", () => ({ redis: { set: mocks.redisSet, get: mocks.redisGet, del: mocks.redisDel } }));
vi.mock("jsonwebtoken", () => ({ default: { sign: mocks.jwtSign, verify: mocks.jwtVerify } }));

import { login, logout, refreshToken, signup } from "../backend/controllers/auth.controller.js";

const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn(), cookie: vi.fn(), clearCookie: vi.fn() });

beforeEach(() => {
    vi.clearAllMocks();
    process.env.ACCESS_TOKEN_SECRET = "access-secret";
    process.env.REFRESH_TOKEN_SECRET = "refresh-secret";
    mocks.jwtSign.mockImplementation((_payload, secret) => secret === "access-secret" ? "access-token" : "refresh-token");
    mocks.redisSet.mockResolvedValue("OK");
    mocks.redisGet.mockResolvedValue("refresh-token");
    mocks.redisDel.mockResolvedValue(1);
});

describe("auth controllers", () => {
    it("signs up a new user, stores the refresh token, and sets cookies", async () => {
        const user = { _id: "u1", name: "Nick", email: "nick@example.com", role: "customer" };
        mocks.create.mockResolvedValue(user); mocks.findOne.mockResolvedValue(null); const res = response();
        await signup({ body: { name: "Nick", email: "nick@example.com", password: "password123" } }, res);
        expect(mocks.create).toHaveBeenCalledWith({ name: "Nick", email: "nick@example.com", password: "password123" });
        expect(mocks.redisSet).toHaveBeenCalledWith("refreshToken:u1", "refresh-token", "EX", 604800);
        expect(res.cookie).toHaveBeenCalledTimes(2); expect(res.status).toHaveBeenCalledWith(201); expect(res.json).toHaveBeenCalledWith(user);
    });
    it("rejects duplicate signup", async () => {
        mocks.findOne.mockResolvedValue({ _id: "existing" }); const res = response();
        await signup({ body: { name: "Nick", email: "nick@example.com", password: "password123" } }, res);
        expect(res.status).toHaveBeenCalledWith(400); expect(res.json).toHaveBeenCalledWith({ message: "User already exists" }); expect(mocks.create).not.toHaveBeenCalled();
    });
    it("logs in with valid credentials", async () => {
        const user = { _id: "u1", name: "Nick", email: "nick@example.com", role: "customer", comparePassword: vi.fn().mockResolvedValue(true) };
        mocks.findOne.mockResolvedValue(user); const res = response();
        await login({ body: { email: "nick@example.com", password: "password123" } }, res);
        expect(user.comparePassword).toHaveBeenCalledWith("password123"); expect(mocks.redisSet).toHaveBeenCalledWith("refreshToken:u1", "refresh-token", "EX", 604800); expect(res.status).toHaveBeenCalledWith(200);
    });
    it("rejects invalid login credentials", async () => {
        mocks.findOne.mockResolvedValue(null); const res = response(); await login({ body: { email: "wrong@example.com", password: "bad" } }, res);
        expect(res.status).toHaveBeenCalledWith(400); expect(res.json).toHaveBeenCalledWith({ message: "Invalid email or password" });
    });
    it("rejects refresh when no refresh cookie exists", async () => {
        const res = response(); await refreshToken({ cookies: {} }, res); expect(res.status).toHaveBeenCalledWith(401);
    });
    it("rejects a refresh token that is not the stored token", async () => {
        mocks.redisGet.mockResolvedValue("different-token"); mocks.jwtVerify.mockReturnValue({ userId: "u1" }); const res = response();
        await refreshToken({ cookies: { refreshToken: "refresh-token" } }, res); expect(res.status).toHaveBeenCalledWith(401);
    });
    it("refreshes an access token when the stored refresh token matches", async () => {
        mocks.jwtVerify.mockReturnValue({ userId: "u1" }); const res = response(); await refreshToken({ cookies: { refreshToken: "refresh-token" } }, res);
        expect(mocks.jwtSign).toHaveBeenCalledWith({ userId: "u1" }, "access-secret", { expiresIn: "15m" }); expect(res.status).toHaveBeenCalledWith(200);
    });
    it("logs out and clears both auth cookies", async () => {
        mocks.jwtVerify.mockReturnValue({ userId: "u1" }); const res = response(); await logout({ cookies: { refreshToken: "refresh-token" } }, res);
        expect(mocks.redisDel).toHaveBeenCalledWith("refreshToken:u1"); expect(res.clearCookie).toHaveBeenCalledWith("refreshToken"); expect(res.clearCookie).toHaveBeenCalledWith("accessToken"); expect(res.status).toHaveBeenCalledWith(200);
    });
});
