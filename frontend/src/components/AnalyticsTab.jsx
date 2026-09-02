import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const AnalyticsTab = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => { axios.get("/analytics").then((response) => setData(response.data)).catch((err) => setError(err.response?.data?.message || "Failed to load analytics")); }, []);
    if (error) return <div className="rounded-lg border border-red-800 bg-red-950/40 p-6 text-red-200">{error}</div>;
    if (!data) return <div className="py-12 text-center text-stone-300">Loading analytics…</div>;
    const analytics = data.analyticsData || {}; const statuses = analytics.ordersByStatus || {};
    const cards = [["Customers", analytics.users || 0, Users], ["Products", analytics.products || 0, Package], ["Paid Sales", analytics.totalSales || 0, ShoppingCart], ["Revenue", `$${Number(analytics.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, DollarSign]];
    return <div className="max-w-7xl mx-auto space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{cards.map(([title,value,Icon]) => <motion.div key={title} className="bg-stone-800 rounded-lg p-6 shadow-lg" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}><div className="flex items-center justify-between"><div><p className="text-yellow-300 text-sm mb-1 font-semibold">{title}</p><h3 className="text-white text-3xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</h3></div><Icon className="h-10 w-10 text-yellow-400" /></div></motion.div>)}</div><div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{Object.entries(statuses).map(([status,count]) => <div key={status} className="rounded-lg bg-stone-800 p-4"><p className="text-xs uppercase text-stone-400">{status.replace("_", " ")}</p><p className="text-2xl font-semibold text-white">{count}</p></div>)}</div><div className="bg-stone-800/60 rounded-lg p-6 shadow-lg"><h2 className="text-xl font-semibold mb-4">Last 7 Days</h2><ResponsiveContainer width="100%" height={400}><LineChart data={data.dailySalesData || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" stroke="#D1D5DB" /><YAxis yAxisId="left" stroke="#D1D5DB" /><YAxis yAxisId="right" orientation="right" stroke="#D1D5DB" /><Tooltip /><Legend /><Line yAxisId="left" type="monotone" dataKey="sales" stroke="#10B981" activeDot={{ r: 8 }} name="Sales" /><Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3B82F6" activeDot={{ r: 8 }} name="Revenue" /></LineChart></ResponsiveContainer></div></div>;
};
export default AnalyticsTab;
