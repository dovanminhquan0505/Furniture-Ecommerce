const admin = require("firebase-admin");

const getDb = () => admin.firestore();

// Lấy tất cả người dùng
const getAllUsers = [
    async (req, res) => {
        try {
            const db = getDb();
            const snapshot = await db.collection("users").get();
            const users = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
];

// Lấy thông tin của người dùng hiện tại
const getUserById = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;

        const userDoc = await db.collection("users").doc(id).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userDoc.data();

        res.status(200).json({
            id: userDoc.id,
            ...userData,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật thông tin người dùng
const updateUserById = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const { displayName, birthDate, phone, address } = req.body;

        const updateData = {};
        if (displayName) updateData.displayName = displayName;
        if (birthDate) {
            updateData.birthDate = admin.firestore.Timestamp.fromDate(new Date(birthDate));
        }
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }

        await db.collection("users").doc(id).update(updateData);

        if (displayName) {
            const updateAuthData = { displayName };
            await admin.auth().updateUser(id, updateAuthData);
        }

        res.status(200).json({
            message: "User updated successfully",
            updatedFields: Object.keys(updateData),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserProfileById = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const userDoc = await db.collection("users").doc(id).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userDoc.data();

        res.status(200).json({
            id: userDoc.id,
            displayName: userData.displayName || "",
            email: userData.email,
            phone: userData.phone || "",
            address: userData.address || "",
            birthDate: userData.birthDate
                ? userData.birthDate.toDate().toISOString().split("T")[0]
                : "",
            role: userData.role || "user",
            photoURL: userData.photoURL || "",
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateUserPhoto = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const { photoURL } = req.body;
        if (!photoURL) {
            return res.status(400).json({ error: "Photo URL is required" });
        }
        await db.collection("users").doc(id).update({ photoURL });
        res.status(200).json({ message: "User photo updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ error: "New password is required" });
        }

        await admin.auth().updateUser(id, { password: newPassword });
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const snapshot = await db
            .collection("totalOrders")
            .where("userId", "==", id)
            .get();
            const orders = snapshot.docs.map((doc) => ({
                orderId: doc.id,
                date: doc.data().createdAt.toDate().toISOString().split("T")[0], 
                totalPrice: doc.data().totalPrice,
                paidAt: doc.data().isPaid
                    ? doc.data().paidAt.toDate().toISOString() 
                    : "No",
                deliveredAt: doc.data().isDelivered
                    ? doc.data().deliveredAt.toDate().toISOString()
                    : "No",
            }));
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserSubOrders = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const snapshot = await db.collection("subOrders").where("userId", "==", id).get();

        const batch = db.batch(); // Batch để cập nhật subOrders
        const subOrders = await Promise.all(
            snapshot.docs.map(async (doc) => {
                const data = doc.data();
                const items = [];

                // Cache product and seller details
                const productCache = new Map();
                const sellerCache = new Map();

                // Helper function to fetch product details
                const fetchProductDetails = async (itemId) => {
                    if (productCache.has(itemId)) {
                        return productCache.get(itemId);
                    }
                    const productDoc = await db.collection("products").doc(itemId).get();
                    if (productDoc.exists) {
                        const productData = productDoc.data();
                        productCache.set(itemId, productData);
                        return productData;
                    }
                    return null;
                };

                // Helper function to fetch seller details
                const fetchSellerDetails = async (sellerId) => {
                    if (sellerCache.has(sellerId)) {
                        return sellerCache.get(sellerId);
                    }
                    const sellerDoc = await db.collection("sellers").doc(sellerId).get();
                    if (sellerDoc.exists) {
                        const sellerData = sellerDoc.data();
                        sellerCache.set(sellerId, sellerData);
                        return sellerData;
                    }
                    return null;
                };

                // Fetch billing info and isPaid from totalOrders
                let billingInfo = null;
                let isPaid = false;
                let paidAt = "No";
                if (data.totalOrderId) {
                    const totalOrderDoc = await db.collection("totalOrders").doc(data.totalOrderId).get();
                    if (totalOrderDoc.exists) {
                        const orderData = totalOrderDoc.data();
                        billingInfo = {
                            recipientName: orderData.billingInfo?.name || "Not Provided",
                            phone: orderData.billingInfo?.phone || "Not Provided",
                            address: `${orderData.billingInfo?.address || ""} ${orderData.billingInfo?.city || ""} ${orderData.billingInfo?.country || ""}`,
                            email: orderData.billingInfo?.email || "Not Provided",
                        };
                        isPaid = orderData.isPaid || false;
                        paidAt = orderData.isPaid
                            ? orderData.paidAt?.toDate().toISOString() || "No"
                            : "No";

                        // Đồng bộ isPaid và paidAt trong subOrders nếu khác
                        if (data.isPaid !== isPaid || data.paidAt !== paidAt) {
                            const subOrderRef = db.collection("subOrders").doc(doc.id);
                            batch.update(subOrderRef, { isPaid, paidAt });
                        }
                    }
                }

                // Process non-canceled items
                if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                    data.items.forEach((item) => {
                        productCache.set(item.id, {
                            productName: item.productName,
                            imgUrl: item.imgUrl,
                            price: item.price,
                            category: item.category,
                        });

                        const cancelledItems = (data.cancelledItems || []).filter(
                            (c) => c.itemId === item.id
                        );
                        const refundedItems = (data.refundItems || []).filter(
                            (r) => r.itemId === item.id && r.status === "Refunded"
                        );

                        const nonCancelledQuantity = item.quantity || 0;
                        if (nonCancelledQuantity > 0 && !refundedItems.length) {
                            items.push({
                                subOrderId: doc.id,
                                orderId: data.totalOrderId || null,
                                productName: item.productName || "Not Provided",
                                productImage: item.imgUrl || null,
                                quantity: nonCancelledQuantity,
                                price: item.price || 0,
                                totalPrice: (item.price || 0) * nonCancelledQuantity,
                                status: data.status || "unknown",
                                cancelStatus: "None",
                                cancelledAt: null,
                                reason: null,
                                itemId: item.id,
                                refundStatus: "None",
                                isPaid,
                                paidAt,
                            });
                        }

                        cancelledItems.forEach((cancelledItem) => {
                            items.push({
                                subOrderId: doc.id,
                                orderId: data.totalOrderId || null,
                                productName: item.productName || "Not Provided",
                                productImage: item.imgUrl || null,
                                quantity: cancelledItem.quantity || 0,
                                price: item.price || 0,
                                totalPrice: (item.price || 0) * (cancelledItem.quantity || 0),
                                status: data.status || "unknown",
                                cancelStatus: cancelledItem.status || "cancelled",
                                cancelledAt: cancelledItem.cancelledAt
                                    ? cancelledItem.cancelledAt.toDate().toISOString()
                                    : null,
                                reason: cancelledItem.reason || null,
                                itemId: item.id,
                                refundStatus: "None",
                                isPaid,
                                paidAt,
                            });
                        });

                        refundedItems.forEach((refundedItem) => {
                            items.push({
                                subOrderId: doc.id,
                                orderId: data.totalOrderId || null,
                                productName: item.productName || "Not Provided",
                                productImage: item.imgUrl || null,
                                quantity: refundedItem.quantity || 0,
                                price: item.price || 0,
                                totalPrice: (item.price || 0) * (refundedItem.quantity || 0),
                                status: data.status || "unknown",
                                cancelStatus: "None",
                                cancelledAt: null,
                                reason: refundedItem.reason || null,
                                itemId: refundedItem.itemId,
                                refundStatus: refundedItem.status || "Refunded",
                                isPaid,
                                paidAt,
                            });
                        });
                    });
                }

                // Process canceled items for sub-orders with no active items
                if (data.cancelledItems && Array.isArray(data.cancelledItems) && data.cancelledItems.length > 0) {
                    await Promise.all(
                        data.cancelledItems.map(async (cancelledItem) => {
                            const alreadyProcessed = items.some(
                                (entry) =>
                                    entry.itemId === cancelledItem.itemId &&
                                    entry.cancelStatus === cancelledItem.status &&
                                    entry.quantity === cancelledItem.quantity
                            );
                            if (alreadyProcessed) return;

                            let product = (data?.items || []).find((i) => i?.id === cancelledItem?.itemId);
                            if (!product) {
                                const productData = await fetchProductDetails(cancelledItem.itemId);
                                product = productData || {
                                    productName: "Not Provided",
                                    imgUrl: null,
                                    price: 0,
                                    category: "Unknown",
                                };
                            }

                            items.push({
                                subOrderId: doc.id,
                                orderId: data.totalOrderId || null,
                                productName: product.productName || "Not Provided",
                                productImage: product.imgUrl || null,
                                quantity: cancelledItem.quantity || 0,
                                price: product.price || 0,
                                totalPrice: (product.price || 0) * (cancelledItem.quantity || 0),
                                status: data.status || "unknown",
                                cancelStatus: cancelledItem.status || "cancelled",
                                cancelledAt: cancelledItem.cancelledAt
                                    ? cancelledItem.cancelledAt.toDate().toISOString()
                                    : null,
                                reason: cancelledItem.reason || null,
                                itemId: cancelledItem.itemId,
                                refundStatus: "None",
                                isPaid,
                                paidAt,
                            });
                        })
                    );
                }

                // Process refunded items
                if (data.refundedItems && Array.isArray(data.refundedItems) && data.refundedItems.length > 0) {
                    await Promise.all(
                        data.refundedItems.map(async (refundedItem) => {
                            if (refundedItem.status !== "Refunded") return;

                            const alreadyProcessed = items.some(
                                (entry) =>
                                    entry.itemId === refundedItem.itemId &&
                                    entry.refundedStatus === "Refunded" &&
                                    entry.quantity === refundedItem.quantity
                            );
                            if (alreadyProcessed) return;

                            let product = (data?.items || []).find((i) => i.id === refundedItem?.itemId);
                            if (!product) {
                                const productData = await fetchProductDetails(refundedItem.itemId);
                                product = productData || {
                                    productName: "Not Provided",
                                    imgUrl: null,
                                    price: 0,
                                    category: "Unknown",
                                };
                            }

                            items.push({
                                subOrderId: doc.id,
                                orderId: data.totalOrderId || null,
                                productName: product.productName || "Not Provided",
                                productImage: product.imgUrl || null,
                                quantity: refundedItem.quantity || 0,
                                price: product.price || 0,
                                totalPrice: (product.price || 0) * (refundedItem.quantity || 0),
                                status: data.status || "unknown",
                                cancelStatus: "None",
                                cancelledAt: null,
                                reason: refundedItem.reason || null,
                                itemId: refundedItem.itemId,
                                refundStatus: refundedItem.status || "Refunded",
                                isPaid,
                                paidAt,
                            });
                        })
                    );
                }

                // Fallback for sub-orders with no items
                if (items.length === 0) {
                    items.push({
                        subOrderId: doc.id,
                        orderId: data.totalOrderId || null,
                        productName: "Not Provided",
                        productImage: null,
                        quantity: data.totalQuantity || 0,
                        price: data.totalAmount || 0,
                        totalPrice: data.totalAmount || 0,
                        status: data.status || "unknown",
                        cancelStatus: data.cancelStatus || "None",
                        cancelledAt: data.cancelledAt
                            ? data.cancelledAt?.toDate().toISOString()
                            : null,
                        reason: null,
                        itemId: null,
                        refundStatus: data.refundedStatus || "None",
                        isPaid,
                        paidAt,
                    });
                }

                // Get seller's store name
                const sellerData = await fetchSellerDetails(data.sellerId);
                const storeName = sellerData?.storeName || "Not Provided";

                return {
                    subOrderId: doc.id,
                    orderId: data.totalOrderId || null,
                    items,
                    refundItems: data.refundItems || [],
                    status: data.status || "unknown",
                    cancelStatus: data.cancelStatus || "None",
                    totalQuantity: data.totalQuantity || 0,
                    totalAmount: data.totalAmount || 0,
                    sellerId: data.sellerId || null,
                    storeName,
                    userId: data.userId || null,
                    createdAt: data.createdAt ? data.createdAt?.toDate().toISOString() : null,
                    billingInfo,
                    isPaid,
                    paidAt,
                };
            })
        );

        // Commit batch updates
        await batch.commit();

        // Flatten the array
        const flattenedSubOrders = subOrders.flatMap(subOrder => subOrder.items.map(item => ({
            ...item,
            refundItems: subOrder.refundItems,
            sellerId: subOrder.sellerId,
            storeName: subOrder.storeName,
            userId: subOrder.userId,
            createdAt: subOrder.createdAt,
            billingInfo: subOrder.billingInfo,
            isPaid: subOrder.isPaid,
            paidAt: subOrder.paidAt,
        })));

        res.status(200).json(flattenedSubOrders);
    } catch (error) {
        console.error("Error fetching user subOrders:", error);
        res.status(500).json({ error: "Failed to fetch user subOrders: " + error.message });
    }
};

const deleteUserOrder = async (req, res) => {
    try {
        const db = getDb();
        const { orderId } = req.params;
        await db.collection("totalOrders").doc(orderId).delete();
        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Notifications
const getUserNotifications = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const notificationsSnap = await db
            .collection("userNotifications")
            .where("userId", "==", id)
            .orderBy("createdAt", "desc")
            .limit(10)
            .get();

        const notifications = notificationsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate().toISOString(),
        }));

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const markUserNotificationAsRead = async (req, res) => {
    try {
        const db = getDb();
        const { id, notificationId } = req.params;
        const notificationRef = db.collection("userNotifications").doc(notificationId);
        const notificationSnap = await notificationRef.get();

        if (!notificationSnap.exists) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const notificationData = notificationSnap.data();
        if (notificationData.userId !== id) {
            return res.status(403).json({ error: "Unauthorized to mark this notification" });
        }

        await notificationRef.update({
            isRead: true,
            readAt: admin.firestore.Timestamp.now(),
        });

        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getUserById,
    updateUserById,
    getUserProfileById,
    updateUserPhoto,
    updateUserPassword,
    getUserOrders,
    deleteUserOrder,
    getUserNotifications,
    markUserNotificationAsRead,
    getUserSubOrders,
    getAllUsers
}