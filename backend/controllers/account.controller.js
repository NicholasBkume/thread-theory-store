import mongoose from "mongoose";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";

export const updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
        const user = await User.findByIdAndUpdate(req.user._id, { name: name.trim() }, { new: true }).select("-password");
        res.json(user);
    } catch (error) { res.status(500).json({ message: "Failed to update profile" }); }
};

export const getWishlist = async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.json({ products: user?.wishlist || [] });
};

export const toggleWishlist = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const user = await User.findById(req.user._id);
    const exists = user.wishlist.some((id) => id.toString() === product._id.toString());
    if (exists) user.wishlist = user.wishlist.filter((id) => id.toString() !== product._id.toString());
    else user.wishlist.push(product._id);
    await user.save();
    res.json({ wishlisted: !exists, products: user.wishlist });
};

export const addAddress = async (req, res) => {
    const { label, name, line1, line2, city, state, postalCode, country, phone, isDefault } = req.body;
    if (!name || !line1 || !city || !state || !postalCode) return res.status(400).json({ message: "Complete address is required" });
    const user = await User.findById(req.user._id);
    if (isDefault || user.addresses.length === 0) user.addresses.forEach((address) => { address.isDefault = false; });
    user.addresses.push({ label, name, line1, line2, city, state, postalCode, country: country || "US", phone, isDefault: isDefault || user.addresses.length === 0 });
    await user.save();
    res.status(201).json({ addresses: user.addresses });
};

export const deleteAddress = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.addressId)) return res.status(400).json({ message: "Invalid address ID" });
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter((address) => address._id.toString() !== req.params.addressId);
    if (user.addresses.length && !user.addresses.some((address) => address.isDefault)) user.addresses[0].isDefault = true;
    await user.save();
    res.json({ addresses: user.addresses });
};

export const createReview = async (req, res) => {
    const { rating, title, comment } = req.body;
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 || !comment?.trim()) return res.status(400).json({ message: "Rating and comment are required" });
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const purchased = await Order.exists({ user: req.user._id, "products.product": product._id, paymentStatus: "paid" });
    const review = await Review.findOneAndUpdate(
        { product: product._id, user: req.user._id },
        { rating: Number(rating), title: title?.trim(), comment: comment.trim(), verifiedPurchase: Boolean(purchased), status: "approved" },
        { upsert: true, new: true, runValidators: true }
    ).populate("user", "name");
    res.status(201).json(review);
};

export const getProductReviews = async (req, res) => {
    const reviews = await Review.find({ product: req.params.productId, status: "approved" }).sort({ createdAt: -1 }).populate("user", "name");
    const summary = reviews.reduce((acc, review) => { acc.total += 1; acc.sum += review.rating; return acc; }, { total: 0, sum: 0 });
    res.json({ reviews, count: summary.total, average: summary.total ? Number((summary.sum / summary.total).toFixed(1)) : 0 });
};
