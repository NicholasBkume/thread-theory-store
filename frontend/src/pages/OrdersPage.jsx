import { useEffect } from "react";
import { useOrderStore } from "../stores/useOrderStore";

const OrdersPage = () => {
    const { orders, loading, fetchMyOrders } = useOrderStore();

    useEffect(() => {
        fetchMyOrders();
    }, [fetchMyOrders]);

    return (
        <main className="container mx-auto px-4 py-16 min-h-screen">
            <h1 className="text-3xl font-bold mb-8">My Orders</h1>
            {loading && !orders.length && <p className="text-stone-400">Loading orders...</p>}
            {!loading && !orders.length && <p className="text-stone-400">You have no orders yet.</p>}
            <div className="space-y-4">
                {orders.map((order) => (
                    <article key={order._id} className="rounded-lg bg-stone-800 border border-stone-700 p-5">
                        <div className="flex flex-wrap justify-between gap-3 mb-4">
                            <div>
                                <h2 className="font-semibold">Order #{order._id.slice(-8)}</h2>
                                <p className="text-sm text-stone-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="capitalize px-3 py-1 rounded-full bg-stone-700 text-sm">{order.status || "processing"}</span>
                        </div>
                        <div className="space-y-2">
                            {order.products?.map((item, index) => (
                                <div key={`${order._id}-${index}`} className="flex justify-between text-sm">
                                    <span>{item.quantity} × product</span>
                                    <span>${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-stone-700 mt-4 pt-4 flex justify-between font-semibold">
                            <span>Total</span>
                            <span>${Number(order.totalAmount).toFixed(2)}</span>
                        </div>
                    </article>
                ))}
            </div>
        </main>
    );
};

export default OrdersPage;
