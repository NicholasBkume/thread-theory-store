import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const sameItem = (item, productId, variantId = null) =>
	item._id === productId && (item.variantId || null) === (variantId || null);

export const useCartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,

	getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	getCartItems: async () => {
		try {
			const res = await axios.get("/cart");
			set({ cart: res.data });
			get().calculateTotals();
		} catch (error) {
			set({ cart: [] });
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	clearCart: async () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0, isCouponApplied: false });
	},
	addToCart: async (product, variantId = null) => {
		try {
			const selectedVariant = variantId ? product.variants?.find((variant) => variant._id === variantId) : null;
			await axios.post("/cart", { productId: product._id, variantId: variantId || undefined });
			toast.success("Product added to cart");

			set((prevState) => {
				const existingItem = prevState.cart.find((item) => sameItem(item, product._id, variantId));
				const cartItem = {
					...product,
					quantity: 1,
					variantId: variantId || null,
					selectedVariant: selectedVariant || null,
					price: Number(selectedVariant?.price ?? product.price),
				};
				const newCart = existingItem
					? prevState.cart.map((item) => sameItem(item, product._id, variantId) ? { ...item, quantity: item.quantity + 1 } : item)
					: [...prevState.cart, cartItem];
				return { cart: newCart };
			});
			get().calculateTotals();
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	removeFromCart: async (productId, variantId = null) => {
		try {
			await axios.delete(`/cart`, { data: { productId, variantId: variantId || undefined } });
			set((prevState) => ({ cart: prevState.cart.filter((item) => !sameItem(item, productId, variantId)) }));
			get().calculateTotals();
		} catch (error) {
			toast.error(error.response?.data?.message || "Unable to remove item");
		}
	},
	updateQuantity: async (productId, quantity, variantId = null) => {
		try {
			if (quantity === 0) {
				await get().removeFromCart(productId, variantId);
				return;
			}
			await axios.put(`/cart/${productId}`, { quantity, variantId: variantId || undefined });
			set((prevState) => ({
				cart: prevState.cart.map((item) => sameItem(item, productId, variantId) ? { ...item, quantity } : item),
			}));
			get().calculateTotals();
		} catch (error) {
			toast.error(error.response?.data?.message || "Unable to update quantity");
		}
	},
	calculateTotals: () => {
		const { cart, coupon } = get();
		const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
		let total = subtotal;
		if (coupon) total = subtotal - subtotal * (coupon.discountPercentage / 100);
		set({ subtotal, total });
	},
}));
