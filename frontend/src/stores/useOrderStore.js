import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useOrderStore = create((set) => ({
    orders: [],
    loading: false,
    fetchMyOrders: async () => {
        set({ loading: true });
        try {
            const { data } = await axios.get("/orders");
            set({ orders: data.orders, loading: false });
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Failed to fetch orders");
        }
    },
    fetchAllOrders: async () => {
        set({ loading: true });
        try {
            const { data } = await axios.get("/orders/admin");
            set({ orders: data.orders, loading: false });
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Failed to fetch orders");
        }
    },
    updateOrderStatus: async (orderId, status) => {
        try {
            const { data } = await axios.patch(`/orders/${orderId}/status`, { status });
            set((state) => ({ orders: state.orders.map((order) => order._id === orderId ? data.order : order) }));
            toast.success("Order status updated");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update order");
        }
    },
}));
