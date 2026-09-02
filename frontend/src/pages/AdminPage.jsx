import { BarChart, ClipboardList, MessageSquare, PlusCircle, ShoppingBasket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnalyticsTab from "../components/AnalyticsTab";
import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import OrdersTab from "../components/OrdersTab";
import ContactMessagesTab from "../components/ContactMessagesTab";
import { useProductStore } from "../stores/useProductStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const tabs = [
    { id: "create", label: "Create Product", icon: PlusCircle }, { id: "products", label: "Products", icon: ShoppingBasket },
    { id: "orders", label: "Orders", icon: ClipboardList }, { id: "customers", label: "Customers", icon: Users },
    { id: "messages", label: "Messages", icon: MessageSquare }, { id: "analytics", label: "Analytics", icon: BarChart },
];

const CustomersTab = () => {
    const [customers, setCustomers] = useState([]); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true);
    const load = async () => { setLoading(true); try { const { data } = await axios.get(`/account/admin/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`); setCustomers(data.customers); } catch (error) { toast.error(error.response?.data?.message || "Failed to load customers"); } finally { setLoading(false); } };
    useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [search]);
    return <div className="space-y-4"><div className="flex flex-col sm:flex-row gap-3 justify-between"><h2 className="text-2xl font-semibold">Customers</h2><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className="rounded bg-stone-700 px-3 py-2" /></div>{loading ? <p className="text-stone-400">Loading customers…</p> : !customers.length ? <p className="text-stone-400">No customers found.</p> : <div className="overflow-x-auto rounded-lg border border-stone-700"><table className="w-full text-left text-sm"><thead className="bg-stone-700"><tr><th className="p-3">Customer</th><th className="p-3">Orders</th><th className="p-3">Spent</th><th className="p-3">Joined</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer._id} className="border-t border-stone-700"><td className="p-3"><div className="font-medium">{customer.name}</div><div className="text-stone-400">{customer.email}</div></td><td className="p-3">{customer.orderCount}</td><td className="p-3">${Number(customer.totalSpent).toFixed(2)}</td><td className="p-3">{new Date(customer.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</div>;
};

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState("create"); const { fetchAllProducts } = useProductStore();
    useEffect(() => { fetchAllProducts(); }, [fetchAllProducts]);
    return <div className="min-h-screen relative overflow-hidden"><div className="relative z-10 container mx-auto px-4 py-16"><motion.h1 className="text-4xl font-bold mb-8 text-yellow-400 text-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>Admin Dashboard</motion.h1><div className="flex flex-wrap justify-center mb-8">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-4 py-2 mx-2 mb-2 rounded-md transition-colors duration-200 ${activeTab === tab.id ? "bg-yellow-600 text-white" : "bg-stone-700 text-stone-300 hover:bg-stone-600"}`}><tab.icon className="mr-2 h-5 w-5" />{tab.label}</button>)}</div>{activeTab === "create" && <CreateProductForm />}{activeTab === "products" && <ProductsList />}{activeTab === "orders" && <OrdersTab />}{activeTab === "customers" && <CustomersTab />}{activeTab === "messages" && <ContactMessagesTab />}{activeTab === "analytics" && <AnalyticsTab />}</div></div>;
};
export default AdminPage;
