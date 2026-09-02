import mongoose from "mongoose";
import Review from "../models/review.model.js";

export const getAdminReviews = async (req, res) => {
    try {
        const status = ["pending", "approved", "rejected"].includes(req.query.status) ? req.query.status : undefined;
        const filter = status ? { status } : {};
        const reviews = await Review.find(filter).sort({ createdAt: -1 }).populate("user", "name email").populate("product", "name image").lean();
        res.json({ reviews });
    } catch { res.status(500).json({ message: "Failed to load reviews" }); }
};

export const moderateReview = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid review ID" });
        const { status } = req.body || {};
        if (!["pending", "approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid review status" });
        const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true }).populate("user", "name email").populate("product", "name image");
        if (!review) return res.status(404).json({ message: "Review not found" });
        res.json({ review });
    } catch { res.status(500).json({ message: "Failed to moderate review" }); }
};

export const deleteReview = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid review ID" });
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ message: "Review not found" });
        res.json({ message: "Review deleted" });
    } catch { res.status(500).json({ message: "Failed to delete review" }); }
};
