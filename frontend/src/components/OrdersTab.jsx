import { useEffect } from "react";
import { useOrderStore } from "../stores/useOrderStore";

const statuses = ["processing", "shipped", "delivered", "cancelled"];

const OrdersTab = () => {
    const { orders, loading, fetchAllOrders, updateOrderStatus } = useOrderStore();

    useEffect(() => {
        fetchAllOrders();
    }, [fetchAllOrders]);

    if (loading && !orders.length) return <div className="text-center py-12 text-stone-300">Loading orders...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Orders</h2>
                <button onClick={fetchAllOrders} className="px-3 py-2 rounded bg-stone-700 hover:bg-stone-600">Refresh</button>
            </div>
            {!orders.length && <p className="text-stone-400">No orders yet.</p>}
            {orders.map((order) => (
                <div key={order._id} className="rounded-lg bg-stone-800 p-4 border border-stone-700">
                    <div className="flex flex-wrap gap-4 justify-between items-center">
                        <div>
                            <p className="font-medium">#{order._id.slice(-8)}</p>
                            <p className="text-sm text-stone-400">{order.user?.name || "Customer"} · {order.user?.email || ""}</p>
                        </div>
                        <p className="font-semibold">${Number(order.totalAmount).toFixed(2)}</p>
                        <select value={order.status || "processing"} onChange={(event) => updateOrderStatus(order._id, event.target.value)} className="bg-stone-700 rounded px-3 py-2">
                            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                    <div className="mt-3 text-sm text-stone-300">
                        {order.products?.map((item, index) => (
                            <span key={`${order._id}-${index}`} className="mr-4">{item.quantity} × ${Number(item.price).toFixed(2)}</span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OrdersTab;
