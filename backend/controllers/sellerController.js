const admin = require("firebase-admin");

const getDb = () => admin.firestore();

const getAllSellers = [
    async (req, res) => {
        try {
            const db = getDb();
            const snapshot = await db.collection("sellers").get();
            const sellers = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            res.status(200).json(sellers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
];

const getSellerNotification = async (req, res) => {
    try {
        const db = getDb();
        const snapshot = await db.collection("sellerNotifications").get();
        const sellerNotifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.status(200).json(sellerNotifications);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
    }
};

const getSellerById = async (req, res) => {
    try {
        const db = getDb();
        const sellerDoc = await db
            .collection("sellers")
            .doc(req.params.sellerId)
            .get();
        if (!sellerDoc.exists)
            return res.status(404).json({ message: "Seller not found" });
        res.json(sellerDoc.data());
    } catch (error) {
        res.status(500).json({ message: "Error fetching seller info", error });
    }
};

const getSellerInfo = async (req, res) => {
    try {
        const db = getDb();
        const sellerDoc = await db
            .collection("sellers")
            .doc(req.params.sellerId)
            .get();
        if (!sellerDoc.exists)
            return res.status(404).json({ message: "Seller not found" });
        res.json(sellerDoc.data());
    } catch (error) {
        res.status(500).json({ message: "Error fetching seller info", error });
    }
};

const getSellerProducts = async (req, res) => {
    try {
        const db = getDb();
        const productsSnapshot = await db
            .collection("products")
            .where("sellerId", "==", req.params.sellerId)
            .get();
        const products = productsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
    }
};

const updateSellerProduct = async (req, res) => {
    try {
        const db = getDb();
        const productRef = db.collection("products").doc(req.params.productId);
        const productDoc = await productRef.get();
        if (!productDoc.exists)
            return res.status(404).json({ message: "Product not found" });

        await productRef.update(req.body);
        const updatedDoc = await productRef.get();
        res.json(updatedDoc.data());
    } catch (error) {
        res.status(500).json({ message: "Error updating product", error });
    }
};

const createSellerProduct = async (req, res) => {
    try {
        const db = getDb();
        const sellerId = req.params.sellerId;
        const productData = { ...req.body, sellerId };

        const productRef = await db.collection("products").add(productData);
        const newProductDoc = await productRef.get();
        const newProduct = { id: productRef.id, ...newProductDoc.data() };

        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({
            message: "Error creating product",
            error: error.message,
        });
    }
};

const deleteSellerProduct = async (req, res) => {
    try {
        const db = getDb();
        const productRef = db.collection("products").doc(req.params.productId);
        const productDoc = await productRef.get();
        if (!productDoc.exists)
            return res.status(404).json({ message: "Product not found" });

        await productRef.delete();
        res.json({ message: "Product deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error });
    }
};

const getSellerOrders = async (req, res) => {
    try {
        const db = getDb();
        const ordersSnapshot = await db
            .collection("subOrders")
            .where("sellerId", "==", req.params.sellerId)
            .get();
        const orders = await Promise.all(
            ordersSnapshot.docs.map(async (doc) => {
                const orderData = doc.data();
                const totalOrderDoc = await db
                    .collection("totalOrders")
                    .doc(orderData.totalOrderId)
                    .get();
                const totalOrderData = totalOrderDoc.exists ? totalOrderDoc.data() : {};
                const userName = totalOrderData.billingInfo?.name || "Unknown";

                const createdAt = orderData.createdAt instanceof admin.firestore.Timestamp
                    ? orderData.createdAt.toDate().toISOString()
                    : orderData.createdAt || new Date().toISOString();

                return {
                    id: doc.id,
                    ...orderData,
                    userName,
                    createdAt,
                    isPaid: totalOrderData.isPaid || orderData.isPaid || false,
                    status: orderData.status || "pending",
                    cancelStatus: orderData.cancelStatus || "None",
                    cancelItemId: orderData.cancelItemId || null,
                    cancelQuantity: orderData.cancelQuantity || null,
                    refundStatus: orderData.refundStatus || "None",
                    refundItems: orderData.refundItems || [],
                };
            })
        );
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
    }
};

const deleteSellerOrder = async (req, res) => {
    try {
        const db = getDb();
        const { sellerId, orderId } = req.params;
        const orderRef = db.collection("subOrders").doc(orderId);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists)
            return res.status(404).json({ message: "Order not found" });
        const orderData = orderDoc.data();
        if (orderData.sellerId !== sellerId) {
            return res
                .status(403)
                .json({ message: "Unauthorized to delete this order" });
        }
        await orderRef.delete();
        res.json({ message: "Order deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting order", error });
    }
};

const updateSellerInfo = async (req, res) => {
    try {
        const db = getDb();
        const sellerRef = db.collection("sellers").doc(req.params.sellerId);
        const sellerDoc = await sellerRef.get();
        if (!sellerDoc.exists)
            return res.status(404).json({ message: "Seller not found" });

        await sellerRef.update(req.body);
        const updatedDoc = await sellerRef.get();
        res.json(updatedDoc.data());
    } catch (error) {
        res.status(500).json({ message: "Error updating seller info", error });
    }
};

const getCurrentSeller = async (req, res) => {
    try {
        const db = getDb();
        const userDoc = await db.collection("users").doc(req.user.uid).get();
        if (!userDoc.exists)
            return res.status(404).json({ message: "User not found" });

        const sellerId = userDoc.data().sellerId;
        const sellerDoc = await db.collection("sellers").doc(sellerId).get();
        if (!sellerDoc.exists)
            return res.status(404).json({ message: "Seller not found" });

        res.json(sellerDoc.data());
    } catch (error) {
        res.status(500).json({
            message: "Error fetching current seller",
            error,
        });
    }
};

const getSellerIdByUserId = async (req, res) => {
    try {
        const db = getDb();
        const userId = req.params.userId;
        const sellerSnapshot = await db.collection("sellers")
            .where("userId", "==", userId)
            .limit(1)
            .get();

        if (sellerSnapshot.empty) {
            return res.status(200).json({ sellerId: null }); 
        }

        const sellerData = sellerSnapshot.docs[0].data();
        res.status(200).json({ sellerId: sellerData.sellerId || sellerSnapshot.docs[0].id }); 
    } catch (error) {
        console.error("Error fetching seller by user:", error);
        res.status(500).json({ message: "Error fetching seller info", error });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const db = getDb();
        const sellerId = req.params.sellerId;
        if (!sellerId) {
            return res.status(400).json({ message: 'Seller ID is required' });
        }

        const now = new Date();
        const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        // Truy vấn subOrders dựa trên sellerId
        const subOrdersSnapshot = await db
            .collection('subOrders')
            .where('sellerId', '==', sellerId)
            .where('createdAt', '>=', monthAgo)
            .get();

        let dailyRevenue = 0, weeklyRevenue = 0, monthlyRevenue = 0, profit = 0, orderCount = 0;
        const revenueByDay = {};
        const productSales = {};

        // Lấy danh sách totalOrderIds từ subOrders
        const totalOrderIds = [...new Set(subOrdersSnapshot.docs.map(doc => doc.data().totalOrderId))];

        // Truy vấn totalOrders để kiểm tra isPaid
        const totalOrdersSnapshot = await db
            .collection('totalOrders')
            .where(admin.firestore.FieldPath.documentId(), 'in', totalOrderIds)
            .get();

        const paidOrderIds = totalOrdersSnapshot.docs
            .filter(doc => doc.data().isPaid === true)
            .map(doc => doc.id);

        // Xử lý dữ liệu từ subOrders
        subOrdersSnapshot.forEach(doc => {
            const subOrder = doc.data();
            const orderDate = subOrder.createdAt.toDate();

            // Chỉ xử lý nếu totalOrder tương ứng đã thanh toán
            if (paidOrderIds.includes(subOrder.totalOrderId)) {
                const revenue = subOrder.totalAmount || 0;
                const orderProfit = revenue * 0.2; 

                monthlyRevenue += revenue;
                profit += orderProfit;
                orderCount++;

                if (orderDate >= dayAgo) dailyRevenue += revenue;
                if (orderDate >= weekAgo) weeklyRevenue += revenue;

                const dateString = orderDate.toISOString().split('T')[0];
                revenueByDay[dateString] = (revenueByDay[dateString] || 0) + revenue;

                // Xử lý sản phẩm từ subOrder.items
                if (Array.isArray(subOrder.items)) {
                    subOrder.items.forEach(item => {
                        const productId = item.id || 'unknown';
                        if (!productSales[productId]) {
                            productSales[productId] = {
                                product: item.productName || 'Unknown Product',
                                imgUrl: item.imgUrl || '',
                                totalQuantity: 0,
                                totalRevenue: 0
                            };
                        }
                        productSales[productId].totalQuantity += Number(item.quantity) || 0;
                        productSales[productId].totalRevenue += Number(item.totalPrice) || 0;
                    });
                }
            }
        });

        const revenueData = Object.entries(revenueByDay)
            .map(([date, revenue]) => ({
                date: new Date(date).getTime(),
                revenue: parseFloat(revenue.toFixed(2)),
            }))
            .sort((a, b) => a.date - b.date);

        const allProducts = Object.values(productSales).map(product => ({
            product: product.product,
            imgUrl: product.imgUrl,
            totalQuantity: product.totalQuantity,
            totalRevenue: parseFloat(product.totalRevenue.toFixed(2))
        }));

        res.json({
            dailyRevenue,
            weeklyRevenue,
            monthlyRevenue,
            orderCount,
            profit,
            revenueData,
            topProducts: allProducts
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
    }
};

const getSellerNotifications = async (req, res) => {
    try {
        const db = getDb();
        const sellerId = req.params.sellerId;
        if (!sellerId) {
            return res.status(400).json({ message: "Seller ID is required" });
        }

        const notificationsSnapshot = await db
            .collection("sellerNotifications")
            .where("sellerId", "==", sellerId)
            .orderBy("createdAt", "desc")
            .limit(10)
            .get();

        const notifications = await Promise.all(
            notificationsSnapshot.docs.map(async (doc) => {
                const data = doc.data();
                let userData = { displayName: "Unknown", photoURL: "" };
                if (data.userId) {
                    try {
                        const userDoc = await db.collection("users").doc(data.userId).get();
                        userData = userDoc.exists ? userDoc.data() : userData;
                    } catch (userError) {
                        console.error(`Error fetching user ${data.userId}:`, userError);
                    }
                }

                return {
                    id: doc.id,
                    ...data,
                    userName: userData.displayName || "Unknown",
                    userAvatar: userData.photoURL || "",
                    createdAt: data.createdAt && data.createdAt.toDate
                        ? data.createdAt.toDate().toISOString()
                        : new Date().toISOString(),
                    isRead: data.isRead || false,
                };
            })
        );

        res.json(notifications);
    } catch (error) {
        console.error("Error in getSellerNotifications:", error);
        res.status(500).json({ message: "Error fetching notifications", error: error.message });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const db = getDb();
        const { sellerId, notificationId } = req.params;

        const notificationRef = db.collection("sellerNotifications").doc(notificationId);
        const notificationDoc = await notificationRef.get();

        if (!notificationDoc.exists) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const notificationData = notificationDoc.data();
        if (notificationData.sellerId !== sellerId) {
            return res.status(403).json({ message: "Unauthorized to update this notification" });
        }

        await notificationRef.update({ isRead: true });
        res.json({ message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Error updating notification status", error: error.message });
    }
};

module.exports = {
    getSellerById,
    getSellerInfo,
    getSellerProducts,
    updateSellerProduct,
    createSellerProduct,
    deleteSellerProduct,
    getSellerOrders,
    deleteSellerOrder,
    updateSellerInfo,
    getCurrentSeller,
    getSellerIdByUserId,
    getDashboardStats,
    getSellerNotifications,
    markNotificationAsRead,
    getSellerNotification,
    getAllSellers
}