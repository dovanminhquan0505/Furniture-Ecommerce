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

        const batch = db.batch();
        const subOrders = await Promise.all(
            snapshot.docs.map(async (doc) => {
                const data = doc.data();
                const items = [];

                // Cache product and seller details
                const productCache = new Map();
                const sellerCache = new Map();

                // Helper function to fetch product details
                const fetchProductDetails = async (itemId) => {
                    if (productCache.has(itemId)) return productCache.get(itemId);
                    const productDoc = await db.collection("products").doc(itemId).get();
                    if (productDoc.exists) {
                        const productData = productDoc.data();
                        productCache.set(itemId, productData);
                        return productData;
                    }
                    return { productName: "Not Provided", imgUrl: null, price: 0, category: "Unknown" };
                };

                // Helper function to fetch seller details
                const fetchSellerDetails = async (sellerId) => {
                    if (sellerCache.has(sellerId)) return sellerCache.get(sellerId);
                    const sellerDoc = await db.collection("sellers").doc(sellerId).get();
                    if (sellerDoc.exists) {
                        const sellerData = sellerDoc.data();
                        sellerCache.set(sellerId, sellerData);
                        return sellerData;
                    }
                    return { storeName: "Not Provided" };
                };

                // Fetch billing info, isPaid, and paidAt from totalOrders
                let billingInfo = null;
                let isPaid = false;
                let paidAt = "No";
                let deliveredAt = "No";
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
                        paidAt = orderData.isPaid ? orderData.paidAt?.toDate().toISOString() : "No";
                        deliveredAt = orderData.isDelivered ? orderData.deliveredAt?.toDate().toISOString() : "No";
                        
                        // Sync isPaid and paidAt with subOrders if different
                        if (data.isPaid !== isPaid || data.paidAt !== paidAt) {
                            const subOrderRef = db.collection("subOrders").doc(doc.id);
                            batch.update(subOrderRef, { isPaid, paidAt });
                        }
                    }
                }

                // Track processed items to avoid duplicates
                const processedItems = new Set();

                // Process regular items first
                if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                    await Promise.all(
                        data.items.map(async (item) => {
                            // Use the exact quantity from database without any calculation
                            const currentQuantity = item.quantity || 0;

                            // Only include items that have quantity > 0
                            if (currentQuantity > 0) {
                                let product = item;
                                if (!product.productName) {
                                    const productData = await fetchProductDetails(item.id);
                                    product = { ...item, ...productData };
                                }
                                
                                const itemKey = `${item.id}-regular`;
                                if (!processedItems.has(itemKey)) {
                                    items.push({
                                        subOrderId: doc.id,
                                        orderId: data.totalOrderId || null,
                                        productName: product.productName || "Not Provided",
                                        productImage: product.imgUrl || null,
                                        quantity: currentQuantity, 
                                        price: product.price || 0,
                                        totalPrice: (product.price || 0) * currentQuantity,
                                        status: data.status || "unknown",
                                        cancelStatus: "None",
                                        cancelledAt: null,
                                        reason: null,
                                        itemId: item.id,
                                        refundStatus: "None",
                                        isPaid,
                                        paidAt,
                                        deliveredAt: data.isDelivered ? deliveredAt : "No",
                                        paymentMethod: data.paymentMethod || "Not Provided",
                                    });
                                    processedItems.add(itemKey);
                                }
                            }
                        })
                    );
                }

                // Process cancelled items - ONLY show items that still exist in cancelledItems array
                if (data.cancelledItems && Array.isArray(data.cancelledItems) && data.cancelledItems.length > 0) {
                    await Promise.all(
                        data.cancelledItems.map(async (cancelledItem) => {
                            const itemKey = `${cancelledItem.itemId}-cancelled`;
                            if (!processedItems.has(itemKey)) {
                                let product = (data.items || []).find(i => i.id === cancelledItem.itemId);
                                if (!product || !product.productName) {
                                    const productData = await fetchProductDetails(cancelledItem.itemId);
                                    product = { ...product, ...productData };
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
                                    cancelledAt: cancelledItem.cancelledAt ? cancelledItem.cancelledAt.toDate().toISOString() : null,
                                    reason: cancelledItem.reason || null,
                                    itemId: cancelledItem.itemId,
                                    refundStatus: "None",
                                    isPaid,
                                    paidAt,
                                    deliveredAt: "No",
                                    paymentMethod: data.paymentMethod || "Not Provided",
                                });
                                processedItems.add(itemKey);
                            }
                        })
                    );
                }

                // Process refunded items - ONLY show items that still exist in refundItems array
                if (data.refundItems && Array.isArray(data.refundItems) && data.refundItems.length > 0) {
                    await Promise.all(
                        data.refundItems.map(async (refundedItem) => {
                            if (refundedItem.status !== "Refunded") return;

                            const itemKey = `${refundedItem.itemId}-refunded`;
                            if (!processedItems.has(itemKey)) {
                                let product = (data.items || []).find(i => i.id === refundedItem.itemId);
                                if (!product || !product.productName) {
                                    const productData = await fetchProductDetails(refundedItem.itemId);
                                    product = { ...product, ...productData };
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
                                    deliveredAt: data.isDelivered ? deliveredAt : "No",
                                    paymentMethod: data.paymentMethod || "Not Provided",
                                    refundedAt: refundedItem.refundedAt ? refundedItem.refundedAt.toDate().toISOString() : null,
                                    requestedAt: refundedItem.requestedAt ? refundedItem.requestedAt.toDate().toISOString() : null,
                                    returnRequestedAt: refundedItem.returnRequestedAt ? refundedItem.returnRequestedAt.toDate().toISOString() : null,
                                    returnConfirmedAt: refundedItem.returnConfirmedAt ? refundedItem.returnConfirmedAt.toDate().toISOString() : null,
                                    evidence: refundedItem.evidence || [],
                                });
                                processedItems.add(itemKey);
                            }
                        })
                    );
                }

                // Fallback for sub-orders with no items - only if truly no items exist
                if (items.length === 0 && 
                    (!data.items || data.items.length === 0) && 
                    (!data.cancelledItems || data.cancelledItems.length === 0) && 
                    (!data.refundItems || data.refundItems.length === 0)) {
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
                        cancelledAt: data.cancelledAt ? data.cancelledAt.toDate().toISOString() : null,
                        reason: null,
                        itemId: null,
                        refundStatus: data.refundedStatus || "None",
                        isPaid,
                        paidAt,
                        deliveredAt,
                        paymentMethod: data.paymentMethod || "Not Provided",
                    });
                }

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
                    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
                    billingInfo,
                    isPaid,
                    paidAt,
                    deliveredAt: data.isDelivered && data.deliveredAt ? data.deliveredAt.toDate().toISOString() : "No",
                };
            })
        );

        await batch.commit();

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
            deliveredAt: item.deliveredAt,
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
        const { orderId: subOrderId } = req.params;
        const { itemId, status } = req.body; 
        const subOrderRef = db.collection("subOrders").doc(subOrderId);
        const subOrderDoc = await subOrderRef.get();

        if (!subOrderDoc.exists) {
            return res.status(404).json({ error: "Sub-order not found" });
        }

        const subOrderData = subOrderDoc.data();
        const totalOrderId = subOrderData.totalOrderId;

        let updatedItems = subOrderData.items || [];
        let updatedCancelledItems = subOrderData.cancelledItems || [];
        let updatedRefundItems = subOrderData.refundItems || [];

        if (status === "cancelled" || status === "cancelDirectly") {
            // Simply remove from cancelled items without restoring quantity
            updatedCancelledItems = updatedCancelledItems.filter(
                (item) => item.itemId !== itemId
            );
        } else if (status === "Refunded") {
            // Handle refunded item deletion
            updatedRefundItems = updatedRefundItems.filter(
                (item) => !(item.itemId === itemId && item.status === "Refunded")
            );
        } else {
            // Deleting from regular items
            updatedItems = updatedItems.filter(
                (item) => item.id !== itemId
            );
        }

        // Check if sub-order should be deleted entirely
        if (updatedItems.length === 0 && updatedCancelledItems.length === 0 && updatedRefundItems.length === 0) {
            await subOrderRef.delete();

            if (totalOrderId) {
                const remainingSubOrders = await db
                    .collection("subOrders")
                    .where("totalOrderId", "==", totalOrderId)
                    .get();

                if (remainingSubOrders.empty) {
                    const totalOrderRef = db.collection("totalOrders").doc(totalOrderId);
                    const totalOrderDoc = await totalOrderRef.get();
                    if (totalOrderDoc.exists) {
                        await totalOrderRef.delete();
                    }
                }
            }
        } else {
            // Update the sub-order with new data
            const updateData = {
                items: updatedItems,
                cancelledItems: updatedCancelledItems,
                refundItems: updatedRefundItems,
                totalQuantity: updatedItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
                totalAmount: updatedItems.reduce(
                    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
                    0
                ),
            };

            await subOrderRef.update(updateData);
        }

        res.status(200).json({ message: "Order item deleted successfully" });
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