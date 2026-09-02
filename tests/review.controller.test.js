import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
}));

vi.mock("../backend/models/review.model.js", () => ({ default: mocks }));
import { getAdminReviews, moderateReview, deleteReview } from "../backend/controllers/review.controller.js";

describe("Review moderation", () => {
    beforeEach(() => vi.clearAllMocks());

    it("lists pending reviews for admins", async () => {
        const reviews = [{ _id: "r1", status: "pending" }];
        mocks.find.mockReturnValue({ sort: vi.fn().mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(reviews) }) }) }) });
        const req = { query: { status: "pending" } };
        const res = { json: vi.fn() };
        await getAdminReviews(req, res);
        expect(mocks.find).toHaveBeenCalledWith({ status: "pending" });
        expect(res.json).toHaveBeenCalledWith({ reviews });
    });

    it("changes a review status", async () => {
        const review = { _id: "507f1f77bcf86cd799439011", status: "approved" };
        mocks.findByIdAndUpdate.mockReturnValue({ populate: vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValue(review) }) });
        const req = { params: { id: review._id }, body: { status: "approved" } };
        const res = { json: vi.fn() };
        await moderateReview(req, res);
        expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith(review._id, { status: "approved" }, { new: true, runValidators: true });
        expect(res.json).toHaveBeenCalledWith({ review });
    });

    it("rejects invalid moderation statuses", async () => {
        const req = { params: { id: "507f1f77bcf86cd799439011" }, body: { status: "published" } };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        await moderateReview(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("deletes a review", async () => {
        mocks.findByIdAndDelete.mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
        const req = { params: { id: "507f1f77bcf86cd799439011" } };
        const res = { json: vi.fn() };
        await deleteReview(req, res);
        expect(mocks.findByIdAndDelete).toHaveBeenCalledWith(req.params.id);
        expect(res.json).toHaveBeenCalledWith({ message: "Review deleted" });
    });
});
