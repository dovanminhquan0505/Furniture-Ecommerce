const admin = require("firebase-admin");

const getDb = () => admin.firestore();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const paypal = require("@paypal/checkout-server-sdk");

// Cấu hình PayPal Sandbox
const paypalEnv = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);

// Hàm kiểm tra xem đơn hàng có cần Admin can thiệp không
const shouldAdminIntervene = async (subOrderData) => {
    const now = new Date();
    const requestedAt = subOrderData.refundRequest?.requestedAt?.toDate();
    const returnRequestedAt = subOrderData.returnRequestedAt?.toDate();
    const customerConfirmedAt = subOrderData.customerConfirmedAt?.toDate();

    const FIVE_MINUTES = 5 * 60 * 1000;

    // Trường hợp 1: Seller từ chối và khách hàng khiếu nại 
    if (subOrderData.refundStatus === "Rejected" && subOrderData.appealRequested) {
        return true;
    }

    // Trường hợp 2: Seller không phản hồi trong 1 ngày
    if (subOrderData.refundStatus === "Requested" && requestedAt) {
        const daysSinceRequested = (now - requestedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceRequested > 1) {
            return true;
        }
    }

    // Trường hợp 3: Seller không xác nhận trả hàng trong 1 ngày
    if (subOrderData.refundStatus === "Return Requested" && returnRequestedAt) {
        const daysSinceReturnRequested = (now - returnRequestedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceReturnRequested > 1) {
            return true;
        }
    }

    // Trường hợp 4: Khách xác nhận trả hàng nhưng seller chưa confirm trong 1 ngày
    if (subOrderData.refundStatus === "Return Confirmed" && customerConfirmedAt) {
        const daysSinceReturnRequested = (now - returnRequestedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceReturnRequested > 1) {
            return true;
        }
    }
    return false;
};

const getAdminNotifications = async (req, res) => {
    try {
        const db = getDb();
        const snapshot = await db.collection("adminNotifications").get();
        const adminNotifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.status(200).json(adminNotifications);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
    }
};

/* Profile Admin */
const getAdminProfileById = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const userDoc = await db.collection("users").doc(id).get();

        if (!userDoc.exists || userDoc.data().role !== "admin") {
            return res
                .status(403)
                .json({ error: "Not an admin or user not found" });
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
            role: userData.role || "admin",
            photoURL: userData.photoURL || "",
        });
    } catch (error) {
        console.error("Error fetching admin profile:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateAdminProfile = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const { displayName, birthDate, phone, address } = req.body;

        const userDoc = await db.collection("users").doc(id).get();
        if (!userDoc.exists || userDoc.data().role !== "admin") {
            return res
                .status(403)
                .json({ error: "Not an admin or user not found" });
        }

        await db
            .collection("users")
            .doc(id)
            .update({
                displayName,
                birthDate: birthDate ? new Date(birthDate) : null,
                phone,
                address,
            });

        res.status(200).json({ message: "Admin profile updated successfully" });
    } catch (error) {
        console.error("Error updating admin profile:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateAdminPhoto = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const { photoURL } = req.body;
        if (!photoURL) {
            return res.status(400).json({ error: "Photo URL is required" });
        }

        const userDoc = await db.collection("users").doc(id).get();
        if (!userDoc.exists || userDoc.data().role !== "admin") {
            return res
                .status(403)
                .json({ error: "Not an admin or user not found" });
        }

        await db.collection("users").doc(id).update({ photoURL });
        res.status(200).json({ message: "Admin photo updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateAdminPassword = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ error: "New password is required" });
        }

        const userDoc = await db.collection("users").doc(id).get();
        if (!userDoc.exists || userDoc.data().role !== "admin") {
            return res
                .status(403)
                .json({ error: "Not an admin or user not found" });
        }

        await admin.auth().updateUser(id, { password: newPassword });
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* Pending Orders & Notifications */
const getPendingOrders = async (req, res) => {
    try {
        const db = getDb();
        const pendingOrdersSnapshot = await db
            .collection("pendingOrders")
            .where("status", "==", "pending")
            .get();
        const pendingOrders = await Promise.all(
            pendingOrdersSnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const userSnapshot = await db
                    .collection("users")
                    .where("email", "==", data.email)
                    .get();
                const avatarURL = userSnapshot.empty
                    ? ""
                    : userSnapshot.docs[0].data().photoURL || "";
                return {
                    id: doc.id,
                    ...data,
                    avatarURL,
                    createdAt: data.createdAt.toDate().toISOString(),
                };
            })
        );
        res.status(200).json(pendingOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const approvePendingOrder = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const orderDoc = await db.collection("pendingOrders").doc(id).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: "Pending order not found" });
        }

        const orderData = orderDoc.data();
        const userSnapshot = await db.collection("users").where("email", "==", orderData.email).get();
        if (userSnapshot.empty) {
            return res.status(404).json({ error: "User not found" });
        }

        const userDoc = userSnapshot.docs[0];
        const userId = userDoc.id;
        const sellerId = db.collection("sellers").doc().id; 

        await db.collection("sellers").doc(sellerId).set({
            userId: userId, 
            sellerId: sellerId,
            fullName: orderData.fullName,
            phoneNumber: orderData.phoneNumber,
            storeName: orderData.storeName,
            storeDescription: orderData.storeDescription,
            businessType: orderData.businessType,
            address: orderData.address,
            city: orderData.city,
            storeEmail: orderData.storeEmail,
            role: "seller",
            status: "approved",
            createdAt: orderData.createdAt,
            approvedAt: new Date(),
        });

        await db.collection("users").doc(userId).update({
            role: "seller",
            status: "seller",
            sellerId: sellerId,
        });

        await db.collection("pendingOrders").doc(id).delete();
        res.status(200).json({ message: "Seller account approved and created successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const rejectPendingOrder = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const orderDoc = await db.collection("pendingOrders").doc(id).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: "Pending order not found" });
        }

        await db.collection("pendingOrders").doc(id).delete();
        res.status(200).json({ message: "Order rejected successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* Orders */
const getAllOrders = async (req, res) => {
    try {
        const db = getDb();
        const ordersSnapshot = await db.collection("totalOrders").get();
        const orders = ordersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate().toISOString(),
            paidAt: doc.data().paidAt ? doc.data().paidAt.toDate().toISOString() : null,
        }));
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* Sellers */
const getAllSellers = async (req, res) => {
    try {
        const db = getDb();
        const sellersSnapshot = await db.collection("sellers").get();
        const sellers = sellersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.status(200).json(sellers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteSeller = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        await db.collection("sellers").doc(id).delete();
        res.status(200).json({ message: "Seller deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* Users */
const getAllUsers = async (req, res) => {
    try {
        const db = getDb();
        const usersSnapshot = await db.collection("users").get();
        const users = usersSnapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
        }));
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        await db.collection("users").doc(id).delete();
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* Dashboard */
const getDashboardData = async (req, res) => {
    try {
        const db = getDb();
        const productsSnapshot = await db.collection("products").get();
        const usersSnapshot = await db.collection("users").get();
        const ordersSnapshot = await db.collection("totalOrders").get();
        const sellersSnapshot = await db.collection("sellers").get();

        const products = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const orders = ordersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate().toISOString(),
            paidAt: doc.data().paidAt ? doc.data().paidAt.toDate().toISOString() : null,
        }));
        const sellers = sellersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        res.status(200).json({ products, users, orders, sellers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRefundDisputes = async (req, res) => {
    try {
        const db = getDb();
        const subOrdersSnap = await db.collection("subOrders")
            .where("refundStatus", "in", ["Requested", "Return Requested", "Rejected"])
            .get();
        const appealSubOrdersSnap = await db.collection("subOrders")
            .where("appealRequested", "==", true)
            .get();

        // Combine and deduplicate sub-orders
        const subOrders = [];
        const subOrderIds = new Set();
        for (const snap of [subOrdersSnap, appealSubOrdersSnap]) {
            snap.forEach(doc => {
                if (!subOrderIds.has(doc.id)) {
                    subOrders.push(doc);
                    subOrderIds.add(doc.id);
                }
            });
        }

        const disputes = await Promise.all(subOrders.map(async (doc) => {
            const subOrderData = doc.data();
            const totalOrderSnap = await db.collection("totalOrders").doc(subOrderData.totalOrderId).get();
            const totalOrderData = totalOrderSnap.data();

            const sellerSnap = await db.collection("sellers").doc(subOrderData.sellerId).get();
            const sellerName = sellerSnap.exists ? sellerSnap.data().storeName : "Unknown";

            const needsAdmin = await shouldAdminIntervene(subOrderData);

            if (!needsAdmin && !subOrderData.appealRequested) return null;

            // Skip resolved disputes without appeal
            if (subOrderData.resolvedByAdmin && !subOrderData.appealRequested) {
                return null;
            }

            return {
                orderId: subOrderData.totalOrderId,
                subOrderId: doc.id,
                sellerName,
                customerName: totalOrderData.billingInfo?.name || "Unknown",
                reason: subOrderData.appealRequested ? subOrderData.appealData?.reason || subOrderData.refundRequest?.reason || "N/A" : subOrderData.refundRequest?.reason || "N/A",
                evidence: subOrderData.appealRequested ? subOrderData.appealData?.evidence || subOrderData.refundRequest?.evidence || [] : subOrderData.refundRequest?.evidence || [],
                refundStatus: subOrderData.refundStatus || "None",
                appealRequested: subOrderData.appealRequested || false,
                appealData: subOrderData.appealData || null,
                appealReason: subOrderData.appealReason || null,
                items: subOrderData.items,
                itemDetails: subOrderData.appealData?.itemDetails || subOrderData.refundRequest?.itemDetails || null,
            };
        }));

        const filteredDisputes = disputes.filter((dispute) => dispute !== null);
        res.status(200).json(filteredDisputes);
    } catch (error) {
        res.status(500).json({ message: "Error fetching refund disputes", error: error.message });
    }
};

const resolveRefundDispute = async (req, res) => {
    try {
        const db = getDb();
        const { orderId, subOrderId } = req.params;
        const { action } = req.body;

        const totalOrderRef = db.collection("totalOrders").doc(orderId);
        const totalOrderSnap = await totalOrderRef.get();
        if (!totalOrderSnap.exists) {
            return res.status(404).json({ message: "Order not found" });
        }
        const totalOrderData = totalOrderSnap.data();

        const subOrderRef = db.collection("subOrders").doc(subOrderId);
        const subOrderSnap = await subOrderRef.get();
        if (!subOrderSnap.exists) {
            return res.status(404).json({ message: "Sub-order not found" });
        }
        const subOrderData = subOrderSnap.data();

        let updateData = {};
        if (action === "approve") {
            updateData = {
                refundStatus: "Refunded",
                refundedAt: admin.firestore.Timestamp.now(),
                appealRequested: false,
                resolvedByAdmin: true 
            };

            const paymentResult = totalOrderData.paymentResult;
            const refundAmount = subOrderData.totalAmount;

            if (paymentResult && totalOrderData.paymentMethod === "stripe") {
                // Retrieve the payment intent to check the available balance
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentResult.id);
                const unrefundedAmount = (paymentIntent.amount - paymentIntent.amount_refunded) / 100; // Convert from cents to dollars

                if (refundAmount > unrefundedAmount) {
                    return res.status(400).json({
                        message: "Refund amount exceeds available balance",
                        error: `Refund amount ($${refundAmount.toFixed(2)}) is greater than unrefunded amount on charge ($${unrefundedAmount.toFixed(2)})`,
                    });
                }

                const refund = await stripe.refunds.create({
                    payment_intent: paymentResult.id,
                    amount: Math.round(refundAmount * 100),
                });
                updateData.refundResult = { id: refund.id, status: refund.status };
            } else if (paymentResult && totalOrderData.paymentMethod === "paypal") {
                // Similar validation for PayPal (if applicable)
                const request = new paypal.payments.CapturesGetRequest(paymentResult.id);
                const capture = await paypalClient.execute(request);
                const unrefundedAmount = parseFloat(capture.result.amount.value) - (capture.result.refunded_amount?.value || 0);

                if (refundAmount > unrefundedAmount) {
                    return res.status(400).json({
                        message: "Refund amount exceeds available balance",
                        error: `Refund amount ($${refundAmount.toFixed(2)}) is greater than unrefunded amount on charge ($${unrefundedAmount.toFixed(2)})`,
                    });
                }

                const refundRequest = new paypal.payments.CapturesRefundRequest(paymentResult.id);
                refundRequest.requestBody({
                    amount: { value: refundAmount.toString(), currency_code: "USD" },
                });
                const refund = await paypalClient.execute(refundRequest);
                updateData.refundResult = { id: refund.result.id, status: refund.result.status };
            }

            // Rest of the code remains the same
            const updatedSubOrderItems = subOrderData.items.filter(item => item.quantity > 0);
            const subOrderAmount = subOrderData.totalAmount;
            const subOrderQuantity = subOrderData.totalQuantity;

            const updatedTotalOrderItems = totalOrderData.items.filter(
                (item) => !subOrderData.items.some((subItem) => subItem.id === item.id && item.quantity <= 0)
            );

            const newTotalAmount = totalOrderData.totalAmount - subOrderAmount;
            const newTotalQuantity = totalOrderData.totalQuantity - subOrderQuantity;
            const newTotalShipping = newTotalAmount > 100 ? 0 : 10;
            const newTotalTax = Math.round((0.15 * newTotalAmount * 100) / 100);
            const newTotalPrice = newTotalAmount + newTotalShipping + newTotalTax;

            const totalOrderUpdateData = {
                items: updatedTotalOrderItems,
                totalAmount: newTotalAmount,
                totalQuantity: newTotalQuantity,
                totalShipping: newTotalShipping,
                totalTax: newTotalTax,
                totalPrice: newTotalPrice,
            };

            await subOrderRef.update({
                ...updateData,
                items: updatedSubOrderItems,
                totalAmount: updatedSubOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
                totalQuantity: updatedSubOrderItems.reduce((sum, item) => sum + item.quantity, 0),
            });

            await totalOrderRef.update(totalOrderUpdateData);

            // Notify seller
            await db.collection("sellerNotifications").add({
                sellerId: subOrderData.sellerId,
                type: "appeal_approved",
                message: `Appeal for refund of ${subOrderData.items.length} item(s) in sub-order ${subOrderId} has been approved by admin.`,
                userId: subOrderData.userId,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            // Notify user about appeal approval
            await db.collection("userNotifications").add({
                userId: subOrderData.userId,
                imgUrl: subOrderData.items[0]?.imgUrl || "",
                type: "appeal_approved",
                message: `Your appeal for refund of ${subOrderData.items.length} item(s) in order ${orderId} has been approved by admin.`,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            res.status(200).json({ 
                message: "Refund dispute approved by admin", 
                updatedTotalOrder: totalOrderUpdateData 
            });
        } else if (action === "reject") {
            updateData = {
                refundStatus: "Rejected",
                rejectedAt: admin.firestore.Timestamp.now(),
                appealRequested: false, 
                resolvedByAdmin: true 
            };
            await subOrderRef.update(updateData);

            await db.collection("userNotifications").add({
                userId: subOrderData.userId,
                imgUrl: subOrderData.items[0]?.imgUrl || "",
                type: "appeal_rejected",
                message: `Your appeal for refund of ${subOrderData.items.length} item(s) in order ${orderId} has been rejected by admin.`,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            await db.collection("sellerNotifications").add({
                sellerId: subOrderData.sellerId,
                type: "appeal_rejected",
                message: `Appeal for refund of ${subOrderData.items.length} item(s) in sub-order ${subOrderId} has been rejected by admin.`,
                userId: subOrderData.userId,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            res.status(200).json({ 
                message: "Refund dispute rejected by admin",
                subOrderId: subOrderId
            });
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error resolving refund dispute", error: error.message });
    }
};

module.exports = {
    getAdminProfileById,
    updateAdminProfile,
    updateAdminPhoto,
    updateAdminPassword,
    getPendingOrders,
    approvePendingOrder,
    rejectPendingOrder,
    getAllOrders,
    getAllSellers,
    deleteSeller,
    getAllUsers,
    deleteUser,
    getDashboardData,
    getRefundDisputes,
    resolveRefundDispute,
    getAdminNotifications
}