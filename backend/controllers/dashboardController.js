const admin = require("firebase-admin");
const db = admin.firestore();

exports.getDashboardStats = async (req, res) => {
    try {
      const now = new Date();
      const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  
      const totalOrdersSnapshot = await db
        .collection('totalOrders')
        .where('sellerIds', 'array-contains', req.params.sellerId)
        .where('createdAt', '>=', monthAgo)
        .get();
  
      const subOrdersSnapshot = await db
        .collection('subOrders')
        .where('sellerId', '==', req.params.sellerId)
        .where('createdAt', '>=', monthAgo)
        .get();
  
      let dailyRevenue = 0, weeklyRevenue = 0, monthlyRevenue = 0, profit = 0, orderCount = 0;
      const revenueByDay = {};
      const productSales = {};
  
      totalOrdersSnapshot.forEach(doc => {
        const order = doc.data();
        const orderDate = order.createdAt.toDate();
        const sellerCount = order.sellerIds.length;
        const revenue = order.totalAmount / sellerCount;
        const orderProfit = revenue * 0.2; // 20% profit margin
  
        monthlyRevenue += revenue;
        profit += orderProfit;
        orderCount++;
  
        if (orderDate >= dayAgo) dailyRevenue += revenue;
        if (orderDate >= weekAgo) weeklyRevenue += revenue;
  
        const dateString = orderDate.toISOString().split('T')[0];
        revenueByDay[dateString] = (revenueByDay[dateString] || 0) + revenue;
      });
  
      subOrdersSnapshot.forEach(doc => {
        const subOrder = doc.data();
        if (subOrder.product && subOrder.quantity) {
          productSales[subOrder.product] = (productSales[subOrder.product] || 0) + subOrder.quantity;
        }
      });
  
      const revenueData = Object.entries(revenueByDay)
        .map(([date, revenue]) => ({
          date: new Date(date).getTime(),
          revenue: parseFloat(revenue.toFixed(2)),
        }))
        .sort((a, b) => a.date - b.date);
  
      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([product, quantity]) => ({ product, quantity }));
  
      res.json({
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        orderCount,
        profit,
        revenueData,
        topProducts,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching dashboard stats', error });
    }
};