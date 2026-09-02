import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";

export const updateProfile = async (req, res) => { try { const { name } = req.body; if (!name?.trim()) return res.status(400).json({ message: "Name is required" }); const user = await User.findByIdAndUpdate(req.user._id, { name: name.trim() }, { new: true }).select("-password"); res.json(user); } catch { res.status(500).json({ message: "Failed to update profile" }); } };
export const getWishlist = async (req, res) => { const user = await User.findById(req.user._id).populate("wishlist"); res.json({ products: user?.wishlist || [] }); };
export const toggleWishlist = async (req, res) => { if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product ID" }); const product = await Product.findById(req.params.productId); if (!product) return res.status(404).json({ message: "Product not found" }); const user = await User.findById(req.user._id); const exists = user.wishlist.some((id) => id.toString() === product._id.toString()); if (exists) user.wishlist = user.wishlist.filter((id) => id.toString() !== product._id.toString()); else user.wishlist.push(product._id); await user.save(); res.json({ wishlisted: !exists, products: user.wishlist }); };
export const addAddress = async (req, res) => { const { label, name, line1, line2, city, state, postalCode, country, phone, isDefault } = req.body; if (!name || !line1 || !city || !state || !postalCode) return res.status(400).json({ message: "Complete address is required" }); const user = await User.findById(req.user._id); if (isDefault || user.addresses.length === 0) user.addresses.forEach((address) => { address.isDefault = false; }); user.addresses.push({ label, name, line1, line2, city, state, postalCode, country: country || "US", phone, isDefault: isDefault || user.addresses.length === 0 }); await user.save(); res.status(201).json({ addresses: user.addresses }); };
export const deleteAddress = async (req, res) => { if (!mongoose.isValidObjectId(req.params.addressId)) return res.status(400).json({ message: "Invalid address ID" }); const user = await User.findById(req.user._id); user.addresses = user.addresses.filter((address) => address._id.toString() !== req.params.addressId); if (user.addresses.length && !user.addresses.some((address) => address.isDefault)) user.addresses[0].isDefault = true; await user.save(); res.json({ addresses: user.addresses }); };
export const createReview = async (req, res) => { const { rating, title, comment } = req.body; if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 || !comment?.trim()) return res.status(400).json({ message: "Rating and comment are required" }); if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product ID" }); const product = await Product.findById(req.params.productId); if (!product) return res.status(404).json({ message: "Product not found" }); const purchased = await Order.exists({ user: req.user._id, "products.product": product._id, paymentStatus: "paid" }); const review = await Review.findOneAndUpdate({ product: product._id, user: req.user._id }, { rating: Number(rating), title: title?.trim(), comment: comment.trim(), verifiedPurchase: Boolean(purchased), status: "approved" }, { upsert: true, new: true, runValidators: true }).populate("user", "name"); res.status(201).json(review); };
export const getProductReviews = async (req, res) => { const reviews = await Review.find({ product: req.params.productId, status: "approved" }).sort({ createdAt: -1 }).populate("user", "name"); const summary = reviews.reduce((acc, review) => { acc.total += 1; acc.sum += review.rating; return acc; }, { total: 0, sum: 0 }); res.json({ reviews, count: summary.total, average: summary.total ? Number((summary.sum / summary.total).toFixed(1)) : 0 }); };

export const getCustomers = async (req, res) => {
    try {
        const search = String(req.query.search || "").trim();
        const filter = { role: "customer" };
        if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
        const customers = await User.find(filter).select("-password").sort({ createdAt: -1 }).lean();
        const ids = customers.map((customer) => customer._id);
        const orderStats = await Order.aggregate([{ $match: { user: { $in: ids } } }, { $group: { _id: "$user", orders: { $sum: 1 }, spent: { $sum: "$totalAmount" } } }]);
        const stats = new Map(orderStats.map((item) => [item._id.toString(), item]));
        res.json({ customers: customers.map((customer) => ({ ...customer, orderCount: stats.get(customer._id.toString())?.orders || 0, totalSpent: stats.get(customer._id.toString())?.spent || 0 })) });
    } catch { res.status(500).json({ message: "Failed to fetch customers" }); }
};

export const getCustomerById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid customer ID" });
        const customer = await User.findOne({ _id: req.params.id, role: "customer" }).select("-password");
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 }).select("totalAmount status paymentStatus createdAt trackingNumber carrier");
        res.json({ customer, orders });
    } catch { res.status(500).json({ message: "Failed to fetch customer" }); }
};

export const resetCustomerPassword = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid customer ID" });
        const password = String(req.body?.password || "");
        if (password.length < 6 || password.length > 128) return res.status(400).json({ message: "Password must be 6-128 characters" });
        const customer = await User.findOne({ _id: req.params.id, role: "customer" });
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        customer.password = await bcrypt.hash(password, 10);
        await customer.save();
        res.json({ message: "Customer password reset successfully" });
    } catch { res.status(500).json({ message: "Failed to reset customer password" }); }
};
