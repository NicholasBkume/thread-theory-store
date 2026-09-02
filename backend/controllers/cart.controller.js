import mongoose from "mongoose";
import Product from "../models/product.model.js";

const getCartItemsWithProducts = async (user) => {
    const ids = user.cartItems.map((item) => item.product).filter(Boolean);
    const products = await Product.find({ _id: { $in: ids } });
    const productMap = new Map(products.map((product) => [product.id, product]));
    return user.cartItems.flatMap((item) => {
        const product = productMap.get(item.product?.toString());
        if (!product) return [];
        return [{ ...product.toJSON(), quantity: item.quantity }];
    });
};

export const getCartProducts = async (req, res) => {
    try { res.json(await getCartItemsWithProducts(req.user)); }
    catch (error) { console.log("Error in get cart products controller", error.message); res.status(500).json({ message: "Server error" }); }
};

export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product ID" });
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });
        const user = req.user;
        const existingItem = user.cartItems.find((item) => item.product.toString() === productId);
        if (existingItem) {
            if (existingItem.quantity >= product.stock) return res.status(400).json({ message: "Not enough stock available" });
            existingItem.quantity += 1;
        } else {
            if (product.stock < 1) return res.status(400).json({ message: "Product is out of stock" });
            user.cartItems.push({ product: productId, quantity: 1 });
        }
        await user.save();
        res.json(await getCartItemsWithProducts(user));
    } catch (error) { console.log("Error in addToCart controller", error.message); res.status(500).json({ message: "Server error" }); }
};

export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;
        if (productId && !mongoose.isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product ID" });
        user.cartItems = productId ? user.cartItems.filter((item) => item.product.toString() !== productId) : [];
        await user.save();
        res.json(await getCartItemsWithProducts(user));
    } catch (error) { console.log("Error in remove all from cart controller", error.message); res.status(500).json({ message: "Server error" }); }
};

export const updateQuantity = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const quantity = Number(req.body?.quantity);
        if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 0 || quantity > 100) return res.status(400).json({ message: "Invalid quantity or product ID" });
        const user = req.user;
        const existingItem = user.cartItems.find((item) => item.product.toString() === productId);
        if (!existingItem) return res.status(404).json({ message: "Product not found in cart" });
        if (quantity === 0) user.cartItems = user.cartItems.filter((item) => item.product.toString() !== productId);
        else {
            const product = await Product.findById(productId);
            if (!product) return res.status(404).json({ message: "Product not found" });
            if (quantity > product.stock) return res.status(400).json({ message: `Only ${product.stock} available in stock` });
            existingItem.quantity = quantity;
        }
        await user.save();
        res.json(await getCartItemsWithProducts(user));
    } catch (error) { console.log("Error in update quantity controller", error.message); res.status(500).json({ message: "Server error" }); }
};
