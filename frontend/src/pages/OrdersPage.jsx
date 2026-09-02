import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useOrderStore } from "../stores/useOrderStore";

const stages = ["processing", "shipped", "delivered"];

const OrdersPage = () => {
    const { orders, loading, fetchMyOrders, cancelOrder } = useOrderStore();
    const [cancelling, setCancelling] = useState(null);

    useEffect(() => {
        fetchMyOrders();
    }, [fetchMyOrders]);

    const handleCancel = async (id) => {
        if (!window.confirm("Cancel this order? If it was paid, a Stripe refund will be issued.")) return;
        setCancelling(id);
        await cancelOrder(id);
        setCancelling(null);
    };

    return (
        <main className="container mx-auto min-h-screen px-4 py-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="mb-2 text-sm uppercase tracking-[0.2em] text-yellow-400">Account</p>
                    <h1 className="text-3xl font-bold">My Orders</h1>
                    <p className="mt-2 text-stone-400">Track your purchases and order status.</p>
                </div>
                <Link to="/shop" className="rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400">
                    Continue Shopping
                </Link>
            </div>

            {loading && !orders.length && <p className="text-stone-400">Loading orders...</p>}

            {!loading && !orders.length && (
                <div className="rounded-lg border border-stone-700 bg-stone-800 p-8 text-center">
                    <p className="text-lg font-semibold">You have no orders yet.</p>
                    <p className="mt-2 text-stone-400">Your completed purchases will appear here.</p>
                    <Link to="/shop" className="mt-5 inline-block rounded-md bg-yellow-500 px-5 py-2 font-semibold text-black hover:bg-yellow-400">
                        Browse the Shop
                    </Link>
                </div>
            )}

            <div className="space-y-4">
                {orders.map((order) => {
                    const current = stages.indexOf(order.status);
                    const isClosed = ["cancelled", "refunded"].includes(order.status);

                    return (
                        <article key={order._id} className="rounded-lg border border-stone-700 bg-stone-800 p-5">
                            <div className="mb-4 flex flex-wrap justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold">Order #{order._id.slice(-8)}</h2>
                                    <p className="text-sm text-stone-400">{new Date(order.createdAt).toLocaleString()}</p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-sm capitalize ${isClosed ? "bg-red-900 text-red-200" : "bg-stone-700"}`}>
                                    {order.status || "processing"}
                                </span>
                            </div>

                            {!isClosed && (
                                <div className="mb-5 flex items-center">
                                    {stages.map((stage, index) => (
                                        <div key={stage} className="flex flex-1 items-center">
                                            <div className={`h-3 w-3 rounded-full ${index <= current ? "bg-yellow-500" : "bg-stone-600"}`} />
                                            {index < stages.length - 1 && (
                                                <div className={`h-1 flex-1 ${index < current ? "bg-yellow-500" : "bg-stone-600"}`} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {order.trackingNumber && (
                                <p className="mb-4 text-sm text-stone-300">
                                    Tracking: <strong>{order.carrier ? `${order.carrier} · ` : ""}{order.trackingNumber}</strong>
                                </p>
                            )}

                            <div className="space-y-2">
                                {order.products?.map((item, index) => (
                                    <div key={`${order._id}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                                        <span className="flex items-center gap-2">
                                            {item.product?.image && <img src={item.product.image} alt="" className="h-10 w-10 rounded object-cover" />}
                                            {item.quantity} × {item.product?.name || "Product"}
                                        </span>
                                        <span>${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex justify-between border-t border-stone-700 pt-4 font-semibold">
                                <span>Total</span>
                                <span className="text-yellow-400">${Number(order.totalAmount).toFixed(2)}</span>
                            </div>

                            {order.shippingAddress && (
                                <div className="mt-3 text-sm text-stone-400">
                                    <p>Ship to: {order.shippingAddress.name}</p>
                                    <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                                </div>
                            )}

                            {order.status === "processing" && (
                                <button
                                    disabled={cancelling === order._id}
                                    onClick={() => handleCancel(order._id)}
                                    className="mt-4 rounded-md border border-red-700 px-4 py-2 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50"
                                >
                                    {cancelling === order._id ? "Cancelling…" : "Cancel Order"}
                                </button>
                            )}
                        </article>
                    );
                })}
            </div>
        </main>
    );
};

export default OrdersPage;
