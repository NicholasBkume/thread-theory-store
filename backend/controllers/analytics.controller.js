import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

export const getAnalyticsData = async () => {
    const [totalUsers, totalProducts, salesData, statusData] = await Promise.all([
        User.countDocuments({ role: "customer" }), Product.countDocuments(),
        Order.aggregate([{ $match: { paymentStatus: { $in: ["paid", "partially_refunded"] } } }, { $group: { _id: null, totalSales: { $sum: 1 }, totalRevenue: { $sum: "$totalAmount" } } }]),
        Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
    const summary = salesData[0] || { totalSales: 0, totalRevenue: 0 };
    return { users: totalUsers, products: totalProducts, totalSales: summary.totalSales, totalRevenue: summary.totalRevenue, ordersByStatus: Object.fromEntries(statusData.map((item) => [item._id, item.count])) };
};

export const getDailySalesData = async (startDate, endDate) => {
    const dailySalesData = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, paymentStatus: { $in: ["paid", "partially_refunded"] } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, sales: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
        { $sort: { _id: 1 } },
    ]);
    const byDate = new Map(dailySalesData.map((item) => [item._id, item]));
    return getDatesInRange(startDate, endDate).map((date) => ({ date, sales: byDate.get(date)?.sales || 0, revenue: byDate.get(date)?.revenue || 0 }));
};

function getDatesInRange(startDate, endDate) {
    const dates = []; let currentDate = new Date(startDate);
    while (currentDate <= endDate) { dates.push(currentDate.toISOString().split("T")[0]); currentDate.setDate(currentDate.getDate() + 1); }
    return dates;
}
