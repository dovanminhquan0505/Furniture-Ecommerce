const admin = require("firebase-admin");

const getDb = () => {
    return admin.firestore();
};

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const paypal = require("@paypal/checkout-server-sdk");

// Cấu hình PayPal Sandbox
const paypalEnv = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);

// Hàm để lên lịch chuyển trạng thái
const scheduleStatusUpdate = async (orderId, subOrderId, currentStatus, delay) => {
    setTimeout(async () => {
        const db = getDb();
        const subOrderRef = db.collection("subOrders").doc(subOrderId);
        const subOrderSnap = await subOrderRef.get();
        if (!subOrderSnap.exists) return;

        const subOrderData = subOrderSnap.data();
        if (subOrderData.status !== currentStatus) return;

        let newStatus;
        if (currentStatus === "shipping") newStatus = "success";

        if (newStatus) {
            const updateData = {
                status: newStatus,
                statusUpdatedAt: admin.firestore.Timestamp.now(),
            };
            if (newStatus === "success") {
                updateData.isDelivered = true;
                updateData.deliveredAt = admin.firestore.Timestamp.now();
            }

            await subOrderRef.update(updateData);

            // Notify user about successful delivery
            if (newStatus === "success") {
                await db.collection("userNotifications").add({
                    userId: subOrderData.userId,
                    imgUrl: subOrderData.items[0]?.imgUrl || "",
                    type: "order_delivered",
                    message: `Your order ${orderId} has been successfully delivered.`,
                    totalOrderId: orderId,
                    subOrderId: subOrderId,
                    createdAt: admin.firestore.Timestamp.now(),
                    isRead: false,
                });
            }

            const subOrdersSnap = await db.collection("subOrders")
                .where("totalOrderId", "==", orderId)
                .get();
            const allSubOrdersSuccess = subOrdersSnap.docs.every(doc => doc.data().status === "success");
            if (allSubOrdersSuccess) {
                await db.collection("totalOrders").doc(orderId).update({
                    status: "success",
                    isDelivered: true,
                    deliveredAt: admin.firestore.Timestamp.now(),
                });
            }
        }
    }, delay);
};

const confirmDelivery = async (req, res) => {
    try {
        const db = getDb();
        const { orderId, subOrderId } = req.params;

        const subOrderRef = db.collection("subOrders").doc(subOrderId);
        const subOrderSnap = await subOrderRef.get();

        if (!subOrderSnap.exists) {
            return res.status(404).json({ message: "Sub-order not found" });
        }

        const subOrderData = subOrderSnap.data();
        if (subOrderData.status !== "processing") {
            return res.status(400).json({ message: "Order must be in processing status to confirm delivery" });
        }

        // Check for pending cancel requests
        if (subOrderData.cancelRequests?.some(c => c.status === "Requested")) {
            return res.status(400).json({ message: "Cannot confirm delivery while there are pending cancel requests" });
        }

        await subOrderRef.update({
            status: "shipping",
            statusUpdatedAt: admin.firestore.Timestamp.now(),
        });

        // Notify user about shipping status
        await db.collection("userNotifications").add({
            userId: subOrderData.userId,
            imgUrl: subOrderData.items[0]?.imgUrl || "",
            type: "order_shipping",
            message: `Your order ${orderId} is now being shipped.`,
            totalOrderId: orderId,
            subOrderId: subOrderId,
            createdAt: admin.firestore.Timestamp.now(),
            isRead: false,
        });

        // Schedule shipping to success transition after 30 seconds
        scheduleStatusUpdate(orderId, subOrderId, "shipping", 30000);

        res.status(200).json({ message: "Delivery confirmed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error confirming delivery", error: error.message });
    }
};

const getOrders = async (req, res) => {
    try {
        const db = getDb();
        const snapshot = await db.collection("totalOrders").get();
        const totalOrders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.status(200).json(totalOrders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
    }
};

const getSubOrders = async (req, res) => {
    try {
        const db = getDb();
        const snapshot = await db.collection("subOrders").get();
        const subOrders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.status(200).json(subOrders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
    }
};

const getPendingOrders = async (req, res) => {
    try {
        const db = getDb();
        const snapshot = await db.collection("pendingOrders").get();
        const pendingOrders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.status(200).json(pendingOrders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
    }
};

const createOrder = async (req, res) => {
    try {
        const db = getDb();
        const {
            userId,
            billingInfo,
            items,
            totalQuantity,
            totalAmount,
            totalShipping,
            totalTax,
            totalPrice,
            isPaid = false,
            isDelivered = false,
            sellerIds,
            createdAt,
            paymentMethod = "paypal",
        } = req.body;

        if (!userId || !items.length) {
            return res
                .status(400)
                .json({ message: "userId and items are required" });
        }
        if (totalPrice <= 0) {
            return res
                .status(400)
                .json({ message: "totalPrice must be greater than 0" });
        }

        // 1. Create the total order in totalOrders collection
        const totalOrderData = {
            userId,
            billingInfo,
            items,
            totalQuantity,
            totalAmount,
            totalShipping,
            totalTax,
            totalPrice,
            isPaid,
            isDelivered,
            status: "pending",
            statusUpdatedAt: null,
            createdAt: createdAt
                ? new Date(createdAt)
                : admin.firestore.Timestamp.now(),
            sellerIds,
            paymentMethod,
        };

        const totalOrderRef = await db
            .collection("totalOrders")
            .add(totalOrderData);
        const totalOrderId = totalOrderRef.id;

        // 2. Create sub-orders for each seller
        const subOrders = items.reduce((acc, item) => {
            const sellerId = item.sellerId || "Unknown";
            if (!acc[sellerId]) {
                acc[sellerId] = {
                    sellerId,
                    userId,
                    totalOrderId,
                    items: [],
                    totalQuantity: 0,
                    totalAmount: 0,
                    isPaid: false,
                    isDelivered: false,
                    status: "pending",
                    statusUpdatedAt: null,
                    createdAt: createdAt
                        ? new Date(createdAt)
                        : admin.firestore.Timestamp.now(),
                    paymentMethod,
                    refundStatus: "None", 
                    cancelStatus: "None",
                };
            }

            const itemQuantity = item.quantity || 0;
            const itemPrice = item.price || 0;

            acc[sellerId].items.push({
                id: item.id,
                productName: item.productName,
                price: itemPrice,
                quantity: itemQuantity,
                totalPrice: item.totalPrice,
                imgUrl: item.imgUrl,
                category: item.category || "Unknown",
            });
            acc[sellerId].totalQuantity += itemQuantity;
            acc[sellerId].totalAmount += itemPrice * itemQuantity;

            return acc;
        }, {});

        // Save sub-orders to subOrders collection
        const subOrdersArray = Object.values(subOrders);
        console.log("Creating subOrders:", subOrdersArray);

        if (subOrdersArray.length > 0) {
            const subOrdersRef = db.collection("subOrders");
            const subOrderPromises = subOrdersArray.map((subOrder) => 
                subOrdersRef.add(subOrder)
            );
            
            await Promise.all(subOrderPromises);
            console.log(`Created ${subOrdersArray.length} sub-orders successfully`);
        } else {
            console.warn("No subOrders to create - all items have unknown seller");
        }

        res.status(201).json({
            id: totalOrderId,
            message: "Order and sub-orders created successfully",
            subOrdersCount: subOrdersArray.length
        });
    } catch (error) {
        console.error("Error in createOrder:", error); 
        res.status(500).json({ error: error.message });
    }
};

const getOrderById = async (req, res) => {
    try {
        const db = getDb();
        const { orderId } = req.params;
        const totalOrderRef = db.collection("totalOrders").doc(orderId);
        const totalOrderSnap = await totalOrderRef.get();

        if (!totalOrderSnap.exists) {
            return res.status(404).json({ message: "Order not found" });
        }

        const totalOrderData = {
            id: totalOrderSnap.id,
            isPaid: false,
            isDelivered: false,
            totalPrice: 0,
            totalAmount: 0,
            totalShipping: 0,
            totalTax: 0,
            totalQuantity: 0,
            billingInfo: {},
            items: [],
            sellerIds: [],
            status: "pending", 
            ...totalOrderSnap.data(),
            paidAt: totalOrderSnap.data().paidAt
                ? totalOrderSnap.data().paidAt.toDate().toISOString()
                : null,
            deliveredAt: totalOrderSnap.data().deliveredAt
                ? totalOrderSnap.data().deliveredAt.toDate().toISOString()
                : null,
            statusUpdatedAt: totalOrderSnap.data().statusUpdatedAt ? totalOrderSnap.data().statusUpdatedAt.toDate().toISOString() : null
        };

        const subOrdersRef = db.collection("subOrders");
        const subOrdersSnap = await subOrdersRef
            .where("totalOrderId", "==", orderId)
            .get();

        const subOrdersData = subOrdersSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            statusUpdatedAt: doc.data().statusUpdatedAt ? doc.data().statusUpdatedAt.toDate().toISOString() : null
        }));

        res.status(200).json({
            totalOrder: totalOrderData,
            subOrders: subOrdersData,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching order details",
            error,
        });
    }
};

// orderController.js
const updateOrder = async (req, res) => {
    try {
        const db = getDb();
        const { orderId } = req.params;
        const { subOrderId, isPaid, paidAt, paymentResult, status } = req.body;

        const totalOrderRef = db.collection("totalOrders").doc(orderId);
        const totalOrderSnap = await totalOrderRef.get();

        if (!totalOrderSnap.exists) {
            return res.status(404).json({ message: "Order not found" });
        }

        const updateData = {};
        if (isPaid !== undefined) updateData.isPaid = isPaid;
        if (paidAt) updateData.paidAt = admin.firestore.Timestamp.fromDate(new Date(paidAt));
        if (paymentResult) {
            updateData.paymentResult = {
                ...paymentResult,
                email: paymentResult.email || totalOrderSnap.data().billingInfo?.email || "N/A"
            };
        }

        if (Object.keys(updateData).length > 0) {
            await totalOrderRef.update(updateData);

            if (isPaid === true) {
                const subOrdersSnap = await db.collection('subOrders')
                    .where('totalOrderId', '==', orderId)
                    .get();
                const notificationPromises = subOrdersSnap.docs.map(async (doc) => {
                    const subOrder = doc.data();
                    return db.collection('sellerNotifications').add({
                        sellerId: subOrder.sellerId,
                        type: 'payment',
                        message: `Customer has paid for order ${orderId}. Please confirm the order.`,
                        userId: subOrder.userId,
                        totalOrderId: orderId,
                        subOrderId: doc.id,
                        createdAt: admin.firestore.Timestamp.now(),
                        isRead: false,
                    });
                });
                await Promise.all(notificationPromises);
            }
        }

        if (subOrderId && status) {
            const subOrderRef = db.collection("subOrders").doc(subOrderId);
            const subOrderSnap = await subOrderRef.get();

            if (!subOrderSnap.exists) {
                return res.status(404).json({ message: "Sub-order not found" });
            }

            const subUpdateData = {
                status,
                statusUpdatedAt: admin.firestore.Timestamp.now(),
            };

            await subOrderRef.update(subUpdateData);

            if (status === "processing") {
                // No automatic scheduling for processing to shipping
            }

            const subOrdersSnap = await db.collection("subOrders")
                .where("totalOrderId", "==", orderId)
                .get();
            const allSubOrdersSuccess = subOrdersSnap.docs.every(doc => 
                doc.data().status === "success" || (status === "success" && doc.id === subOrderId)
            );
            if (allSubOrdersSuccess) {
                await totalOrderRef.update({
                    status: "success",
                    isDelivered: true,
                    deliveredAt: admin.firestore.Timestamp.now(),
                });
            }

            return res.status(200).json({ message: "Sub-order updated successfully" });
        }

        res.status(200).json({ message: "Order updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating order", error: error.message });
    }
};

// Stripe function Payment method
const createStripePaymentIntent = async (req, res) => {
    try {
        const db = getDb();
        const { orderId } = req.params;
        const { amount } = req.body;

        const totalOrderRef = db.collection("totalOrders").doc(orderId);
        const totalOrderSnap = await totalOrderRef.get();

        if (!totalOrderSnap.exists) {
            return res.status(404).json({ message: "Order not found" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            metadata: { orderId },
        });

        await totalOrderRef.update({
            paymentResult: {
                id: paymentIntent.id,
                status: paymentIntent.status
            },
            paymentMethod: "stripe"
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({
            message: "Error creating Stripe payment intent",
            error: error.message,
        });
    }
};

// Refund
const requestRefund = async (req, res) => {
    try {
        const db = getDb();
        const { orderId, subOrderId } = req.params;
        const { reason, evidence, itemId, quantity, refundId } = req.body;

        if (!refundId) {
            return res.status(400).json({ message: "Missing refundId in request" });
        }

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

        if (!totalOrderData.isPaid) {
            return res.status(400).json({ message: "Order has not been paid yet" });
        }

        if (subOrderData.status !== "success") {
            return res.status(400).json({ message: "Refund can only be requested for successful orders" });
        }

        const item = subOrderData.items.find((i) => i.id === itemId);
        if (!item || quantity <= 0) {
            return res.status(400).json({ message: "Invalid item or quantity" });
        }

        if (!item.originalQuantity) {
            await subOrderRef.update({
                items: subOrderData.items.map((i) =>
                    i.id === itemId ? { ...i, originalQuantity: i.quantity } : i
                ),
            });
        }

        const originalQuantity = item.originalQuantity || item.quantity;
        const alreadyRefundedQty = (subOrderData.refundItems || [])
            .filter(r => r.itemId === itemId && r.status === "Refunded")
            .reduce((sum, r) => sum + r.quantity, 0);
        const pendingRefundQty = (subOrderData.refundItems || [])
            .filter(r => r.itemId === itemId && ["Requested", "Return Requested", "Return Confirmed"].includes(r.status))
            .reduce((sum, r) => sum + r.quantity, 0);
        const canceledQuantity = (subOrderData.cancelledItems || [])
            .filter(c => c.itemId === itemId)
            .reduce((sum, c) => sum + c.quantity, 0);
        const availableForRefund = originalQuantity - alreadyRefundedQty - pendingRefundQty - canceledQuantity;

        if (quantity > availableForRefund) {
            return res.status(400).json({ 
                message: `Only ${availableForRefund} items available for refund for item ${itemId}.`
            });
        }

        const refundRequest = {
            itemId,
            quantity,
            reason,
            evidence: evidence || [],
            status: "Requested",
            requestedAt: admin.firestore.Timestamp.now(),
            isReturnRequired: true,
            refundId,
        };

        const updatedRefundItems = [
            ...(subOrderData.refundItems || []),
            refundRequest,
        ];

        const hasActiveRefunds = updatedRefundItems.some(r => 
            ["Requested", "Return Requested", "Return Confirmed"].includes(r.status)
        );

        await subOrderRef.update({
            refundItems: updatedRefundItems,
            refundStatus: hasActiveRefunds ? "Requested" : "None",
        });

        await db.collection("sellerNotifications").add({
            sellerId: subOrderData.sellerId,
            type: "refund_request",
            message: `Customer has requested a refund for ${quantity} of ${item.productName} in sub-order ${subOrderId}.`,
            userId: subOrderData.userId,
            totalOrderId: orderId,
            subOrderId,
            createdAt: admin.firestore.Timestamp.now(),
            isRead: false,
        });

        res.status(200).json({ message: "Return & Refund request submitted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error requesting refund", error: error.message });
    }
};

const processRefund = async (req, res) => {
    try {
        const db = getDb();
        const { orderId, subOrderId } = req.params;
        const { action, returnReceived, itemId, quantity, refundId } = req.body;

        const totalOrderRef = db.collection("totalOrders").doc(orderId);
        const totalOrderSnap = await totalOrderRef.get();
        if (!totalOrderSnap.exists) {
            return res.status(404).json({ message: "Order not found" });
        }
        const totalOrderData = totalOrderSnap.data();

        const subOrderRef = db.collection("subOrders").doc(subOrderId);
        const subOrderSnap = await subOrderRef.get();
        if (!subOrderSnap.exists) {
            return res.status(400).json({ message: "Sub-order not found" });
        }
        const subOrderData = subOrderSnap.data();

        const refundItem = (subOrderData.refundItems || []).find(
            (r) => r.itemId === itemId &&
                   r.quantity === quantity &&
                   r.refundId === refundId &&
                   (r.status === (returnReceived ? "Return Confirmed" : "Requested"))
        );
        if (!refundItem) {
            return res.status(400).json({ message: "No valid refund request for this item" });
        }

        const item = subOrderData.items.find((i) => i.id === refundItem.itemId);
        if (!item) {
            return res.status(400).json({ message: "Item not found" });
        }

        const originalQuantity = item.originalQuantity || item.quantity;
        const alreadyRefundedQty = (subOrderData.refundItems || [])
            .filter(r => r.itemId === itemId && r.status === "Refunded")
            .reduce((sum, r) => sum + r.quantity, 0);
        const canceledQuantity = (subOrderData.cancelledItems || [])
            .filter(c => c.itemId === itemId)
            .reduce((sum, c) => sum + c.quantity, 0);
        const availableQtyForRefund = originalQuantity - alreadyRefundedQty - canceledQuantity;

        if (availableQtyForRefund < refundItem.quantity) {
            return res.status(400).json({ message: `Insufficient quantity available for refund.` });
        }

        if (action === "approve") {
            if (refundItem.status === "Requested") {
                const updatedRefundItems = subOrderData.refundItems.map((r) =>
                    r.itemId === itemId && r.quantity === quantity && r.refundId === refundId && r.status === "Requested"
                        ? { ...r, status: "Return Requested", returnRequestedAt: admin.firestore.Timestamp.now() }
                        : r
                );

                const hasActiveRefunds = updatedRefundItems.some(r => 
                    ["Requested", "Return Requested", "Return Confirmed"].includes(r.status)
                );

                await subOrderRef.update({
                    refundItems: updatedRefundItems,
                    refundStatus: hasActiveRefunds ? "Requested" : "None",
                });

                // Notify user about refund approval and return request
                await db.collection("userNotifications").add({
                    userId: subOrderData.userId,
                    imgUrl: item.imgUrl || "",
                    type: "refund_approved",
                    message: `Your refund request for ${refundItem.quantity} of ${item.productName} in order ${orderId} has been approved. Please confirm return.`,
                    totalOrderId: orderId,
                    subOrderId: subOrderId,
                    createdAt: admin.firestore.Timestamp.now(),
                    isRead: false,
                });

                await db.collection("sellerNotifications").add({
                    sellerId: subOrderData.sellerId,
                    type: "return_requested",
                    message: `Customer has been requested to return ${refundItem.quantity} of ${item.productName} for sub-order ${subOrderId}.`,
                    userId: subOrderData.userId,
                    totalOrderId: orderId,
                    subOrderId: subOrderId,
                    createdAt: admin.firestore.Timestamp.now(),
                    isRead: false,
                });

                return res.status(200).json({ message: "Return requested, awaiting customer confirmation" });
                
            } else if (refundItem.status === "Return Confirmed" && returnReceived) {
                const refundAmount = item.price * refundItem.quantity;
                const paymentResult = totalOrderData.paymentResult;

                let refundResult = null;
                if (paymentResult && totalOrderData.paymentMethod === "stripe") {
                    const refund = await stripe.refunds.create({
                        payment_intent: paymentResult.id,
                        amount: Math.round(refundAmount * 100),
                    });
                    refundResult = { id: refund.id, status: refund.status };
                } else if (paymentResult && totalOrderData.paymentMethod === "paypal") {
                    const request = new paypal.payments.CapturesRefundRequest(paymentResult.id);
                    request.requestBody({
                        amount: {
                            value: refundAmount.toFixed(2),
                            currency_code: "USD",
                        },
                    });
                    const refund = await paypalClient.execute(request);
                    refundResult = { id: refund.result.id, status: refund.result.status };
                }

                const updatedItems = subOrderData.items.map((i) => {
                    if (i.id === refundItem.itemId) {
                        const newQuantity = i.quantity - refundItem.quantity;
                        return { 
                            ...i, 
                            quantity: Math.max(0, newQuantity),
                            originalQuantity: i.originalQuantity || i.quantity
                        };
                    }
                    return i;
                });

                const updatedRefundItems = subOrderData.refundItems.map((r) =>
                    r.itemId === itemId && r.quantity === quantity && r.refundId === refundId && r.status === "Return Confirmed"
                        ? { ...r, status: "Refunded", refundedAt: admin.firestore.Timestamp.now() }
                        : r
                );

                const updatedTotalQuantity = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
                const updatedTotalAmount = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

                const hasActiveRefunds = updatedRefundItems.some(r => 
                    ["Requested", "Return Requested", "Return Confirmed"].includes(r.status)
                );

                const updateData = {
                    items: updatedItems,
                    refundItems: updatedRefundItems,
                    totalQuantity: updatedTotalQuantity,
                    totalAmount: updatedTotalAmount,
                    refundStatus: hasActiveRefunds ? "Requested" : "None",
                };
                if (refundResult) updateData.refundResult = refundResult;

                await subOrderRef.update(updateData);

                // Notify user about successful refund
                await db.collection("userNotifications").add({
                    userId: subOrderData.userId,
                    imgUrl: item.imgUrl || "",
                    type: "refund_success",
                    message: `Your refund for ${refundItem.quantity} of ${item.productName} in order ${orderId} has been successfully processed.`,
                    totalOrderId: orderId,
                    subOrderId: subOrderId,
                    createdAt: admin.firestore.Timestamp.now(),
                    isRead: false,
                });

                const subOrdersSnap = await db
                    .collection("subOrders")
                    .where("totalOrderId", "==", orderId)
                    .get();

                let newTotalQuantity = 0;
                let newTotalAmount = 0;
                subOrdersSnap.docs.forEach((doc) => {
                    const subOrder = doc.data();
                    newTotalQuantity += subOrder.totalQuantity;
                    newTotalAmount += subOrder.totalAmount;
                });

                await totalOrderRef.update({
                    totalQuantity: newTotalQuantity,
                    totalAmount: newTotalAmount,
                    totalPrice: newTotalAmount + totalOrderData.totalShipping + totalOrderData.totalTax,
                });

                await db.collection("sellerNotifications").add({
                    sellerId: subOrderData.sellerId,
                    type: "refund_processed",
                    message: `Refund for ${refundItem.quantity} of ${item.productName} in sub-order ${subOrderId} has been processed.`,
                    userId: subOrderData.userId,
                    totalOrderId: orderId,
                    subOrderId: subOrderId,
                    createdAt: admin.firestore.Timestamp.now(),
                    isRead: false,
                });

                res.status(200).json({ message: "Refund processed successfully" });
            } else {
                return res.status(400).json({ message: "Invalid refund state for approval" });
            }
        } else if (action === "reject") {
            const updatedRefundItems = subOrderData.refundItems.map((r) =>
                r.itemId === itemId && r.quantity === quantity && r.refundId === refundId && ["Requested", "Return Confirmed"].includes(r.status)
                    ? { ...r, status: "Rejected", refundRejectedAt: admin.firestore.Timestamp.now() }
                    : r
            );

            const hasActiveRefunds = updatedRefundItems.some(r => 
                ["Requested", "Return Requested", "Return Confirmed"].includes(r.status)
            );

            await subOrderRef.update({
                refundItems: updatedRefundItems,
                refundStatus: hasActiveRefunds ? "Requested" : "None",
            });

            await db.collection("userNotifications").add({
                userId: subOrderData.userId,
                imgUrl: item.imgUrl || "",
                type: "refund_rejected",
                message: `Your refund request for ${refundItem.quantity} of ${item.productName} in order ${orderId} has been declined.`,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            await db.collection("sellerNotifications").add({
                sellerId: subOrderData.sellerId,
                type: "refund_rejected",
                message: `Refund request for ${refundItem.quantity} of ${item.productName} in sub-order ${subOrderId} has been rejected.`,
                userId: subOrderData.userId,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            res.status(200).json({ message: "Refund request rejected successfully" });
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error processing refund", error: error.message });
    }
};

const customerConfirmReturn = async (req, res) => {
    try {
        const db = getDb();
        const { orderId, subOrderId } = req.params;
        const { itemId, quantity, refundId } = req.body;

        if (!itemId || typeof itemId !== "string") {
            return res.status(400).json({ message: `Invalid or missing itemId: ${itemId}` });
        }
        const parsedQuantity = Number(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ message: `Invalid quantity: ${quantity}` });
        }

        const subOrderRef = db.collection("subOrders").doc(subOrderId);
        const subOrderSnap = await subOrderRef.get();
        if (!subOrderSnap.exists) {
            return res.status(404).json({ message: "Sub-order not found" });
        }
        const subOrderData = subOrderSnap.data();

        const refundItem = (subOrderData.refundItems || []).find(
            (r) => String(r.itemId) === String(itemId) &&
                   r.status === "Return Requested" &&
                   Number(r.quantity) === parsedQuantity &&
                   r.refundId === refundId
        );
        if (!refundItem) {
            return res.status(400).json({
                message: `No return request found for itemId: ${itemId}, quantity: ${parsedQuantity}, refundId: ${refundId}, status: Return Requested`
            });
        }

        const updatedRefundItems = subOrderData.refundItems.map((r) =>
            String(r.itemId) === String(itemId) &&
            r.status === "Return Requested" &&
            Number(r.quantity) === parsedQuantity &&
            r.refundId === refundId
                ? { ...r, status: "Return Confirmed", returnConfirmedAt: admin.firestore.Timestamp.now() }
                : r
        );

        await subOrderRef.update({
            refundItems: updatedRefundItems,
            refundStatus: updatedRefundItems.some(r => ["Requested", "Return Requested", "Return Confirmed"].includes(r.status)) ? "Requested" : "None",
        });

        await db.collection("sellerNotifications").add({
            sellerId: subOrderData.sellerId,
            type: "return_confirmed",
            message: `Customer has confirmed return of ${parsedQuantity} of ${subOrderData.items.find(i => String(i.id) === String(itemId))?.productName || 'Unknown Item'} for sub-order ${subOrderId}. Please confirm receipt.`,
            userId: subOrderData.userId,
            totalOrderId: orderId,
            subOrderId: subOrderId,
            createdAt: admin.firestore.Timestamp.now(),
            isRead: false,
        });

        res.status(200).json({ message: "Return confirmed successfully" });
    } catch (error) {
        console.error(`Error in customerConfirmReturn:`, error);
        res.status(500).json({ message: "Error confirming return", error: error.message });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const db = getDb();
        const { orderId, subOrderId } = req.params;
        const { reason, itemId, quantity, cancelId } = req.body;

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

        const item = subOrderData.items.find((i) => i.id === itemId);
        if (!item || quantity <= 0) {
            return res.status(400).json({ message: "Invalid item or quantity" });
        }

        // Calculate available quantity for cancellation
        const originalQuantity = item.originalQuantity || item.quantity;
        const canceledQuantity = (subOrderData.cancelledItems || [])
            .filter((c) => c.itemId === itemId)
            .reduce((sum, c) => sum + c.quantity, 0);
        const pendingCancelQuantity = (subOrderData.cancelRequests || [])
            .filter((c) => c.itemId === itemId && c.status === "Requested")
            .reduce((sum, c) => sum + c.quantity, 0);
        const availableQuantity = originalQuantity - canceledQuantity - pendingCancelQuantity;

        if (quantity > availableQuantity) {
            return res.status(400).json({ message: `Only ${availableQuantity} items available for cancellation.` });
        }

        if (subOrderData.status === "shipping" || subOrderData.status === "success") {
            return res.status(400).json({ message: "Cannot cancel order in this status" });
        }

        // Generate unique cancelId if not provided
        const generatedCancelId = cancelId || `${subOrderId}-${itemId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (subOrderData.status === "pending") {
            let refundResult = null;
            if (totalOrderData.isPaid) {
                const refundAmount = item.price * quantity;
                const paymentResult = totalOrderData.paymentResult;

                if (paymentResult && totalOrderData.paymentMethod === "stripe") {
                    const refund = await stripe.refunds.create({
                        payment_intent: paymentResult.id,
                        amount: Math.round(refundAmount * 100),
                    });
                    refundResult = { id: refund.id, status: refund.status };
                } else if (paymentResult && totalOrderData.paymentMethod === "paypal") {
                    const request = new paypal.payments.CapturesRefundRequest(paymentResult.id);
                    request.requestBody({
                        amount: {
                            value: refundAmount.toFixed(2),
                            currency_code: "USD",
                        },
                    });
                    const refund = await paypalClient.execute(request);
                    refundResult = { id: refund.result.id, status: refund.result.status };
                }
            }

            // Update items in the sub-order
            const updatedItems = subOrderData.items
                .map((i) =>
                    i.id === itemId
                        ? { ...i, quantity: i.quantity - quantity, originalQuantity: i.originalQuantity || i.quantity }
                        : i
                )
                .filter((i) => i.quantity > 0);

            const updatedTotalQuantity = subOrderData.totalQuantity - quantity;
            const updatedTotalAmount = updatedItems.reduce(
                (sum, i) => sum + i.price * i.quantity,
                0
            );

            const updateData = {
                items: updatedItems,
                totalQuantity: updatedTotalQuantity,
                totalAmount: updatedTotalAmount,
                cancelledAt: admin.firestore.Timestamp.now(),
                cancelStatus: "cancelDirectly",
            };

            // Track canceled items
            updateData.cancelledItems = subOrderData.cancelledItems || [];
            updateData.cancelledItems.push({
                itemId: itemId,
                quantity: quantity,
                reason: reason,
                cancelledAt: admin.firestore.Timestamp.now(),
                cancelId: generatedCancelId,
                status: "cancelDirectly",
            });

            if (updatedItems.length === 0) {
                updateData.status = "cancelDirectly";
            }

            if (refundResult) updateData.refundResult = refundResult;

            await subOrderRef.update(updateData);

            // Update total order totals
            const subOrdersSnap = await db
                .collection("subOrders")
                .where("totalOrderId", "==", orderId)
                .get();

            const totalOrderUpdate = {};
            const allSubOrdersCancelled = subOrdersSnap.docs.every(
                (doc) => doc.data().status === "cancelDirectly" || doc.data().status === "cancelled"
            );

            if (allSubOrdersCancelled) {
                totalOrderUpdate.status = "cancelDirectly";
                totalOrderUpdate.cancelledAt = admin.firestore.Timestamp.now();
                totalOrderUpdate.totalQuantity = 0;
                totalOrderUpdate.totalAmount = 0;
                totalOrderUpdate.totalPrice = 0;
            } else {
                let newTotalQuantity = 0;
                let newTotalAmount = 0;
                subOrdersSnap.docs.forEach((doc) => {
                    const subOrder = doc.data();
                    if (subOrder.status !== "cancelDirectly" && subOrder.status !== "cancelled") {
                        newTotalQuantity += subOrder.totalQuantity;
                        newTotalAmount += subOrder.totalAmount;
                    }
                });

                totalOrderUpdate.totalQuantity = newTotalQuantity;
                totalOrderUpdate.totalAmount = newTotalAmount;
                totalOrderUpdate.totalPrice =
                    newTotalAmount + totalOrderData.totalShipping + totalOrderData.totalTax;
            }

            await totalOrderRef.update(totalOrderUpdate);

            // Notify seller
            await db.collection("sellerNotifications").add({
                sellerId: subOrderData.sellerId,
                type: "cancel_processed",
                message: `Customer has cancelled ${quantity} of ${item.productName} in sub-order ${subOrderId} directly.`,
                userId: subOrderData.userId,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            // Notify user
            await db.collection("userNotifications").add({
                userId: subOrderData.userId,
                imgUrl: item.imgUrl || "",
                type: "order_cancelled",
                message: `You have successfully canceled ${quantity} of ${item.productName} in order ${orderId}.`,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            res.status(200).json({
                message: "Order cancelled directly and refunded successfully",
                updatedTotalOrder: {
                    totalQuantity: totalOrderUpdate.totalQuantity || totalOrderData.totalQuantity,
                    totalAmount: totalOrderUpdate.totalAmount || totalOrderData.totalAmount,
                    totalPrice: totalOrderUpdate.totalPrice || totalOrderData.totalPrice,
                    status: totalOrderUpdate.status || totalOrderData.status,
                },
            });
        } else if (subOrderData.status === "processing") {
            if (!totalOrderData.isPaid) {
                return res.status(400).json({ message: "Order has not been paid yet" });
            }

            // Add new cancellation request
            const cancelRequest = {
                cancelId: generatedCancelId,
                itemId,
                quantity,
                reason,
                status: "Requested",
                requestedAt: admin.firestore.Timestamp.now(),
            };

            const updateData = {
                cancelRequests: subOrderData.cancelRequests
                    ? [...subOrderData.cancelRequests, cancelRequest]
                    : [cancelRequest],
                cancelStatus: "Requested",
            };

            await subOrderRef.update(updateData);

            await db.collection("sellerNotifications").add({
                sellerId: subOrderData.sellerId,
                type: "cancel_request",
                message: `Customer has requested to cancel ${quantity} of ${item.productName} in sub-order ${subOrderId}.`,
                userId: subOrderData.userId,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            res.status(200).json({
                message: "Cancellation request submitted, awaiting seller approval",
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Error cancelling order", error: error.message });
    }
};

const processCancelRequest = async (req, res) => {
    try {
        const db = getDb();
        const { orderId, subOrderId } = req.params;
        const { action, cancelId } = req.body;

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

        const cancelRequest = (subOrderData.cancelRequests || []).find(
            (c) => c.cancelId === cancelId && c.status === "Requested"
        );
        if (!cancelRequest) {
            return res.status(400).json({ message: "No pending cancellation request found for this cancelId" });
        }

        const item = subOrderData.items.find((i) => i.id === cancelRequest.itemId);
        if (!item || item.quantity < cancelRequest.quantity) {
            return res.status(400).json({ message: "Invalid item or quantity" });
        }

        if (action === "approve") {
            let refundResult = null;
            if (totalOrderData.isPaid) {
                const refundAmount = item.price * cancelRequest.quantity;
                const paymentResult = totalOrderData.paymentResult;

                if (paymentResult && totalOrderData.paymentMethod === "stripe") {
                    const refund = await stripe.refunds.create({
                        payment_intent: paymentResult.id,
                        amount: Math.round(refundAmount * 100),
                    });
                    refundResult = { id: refund.id, status: refund.status };
                } else if (paymentResult && totalOrderData.paymentMethod === "paypal") {
                    const request = new paypal.payments.CapturesRefundRequest(paymentResult.id);
                    request.requestBody({
                        amount: {
                            value: refundAmount.toFixed(2),
                            currency_code: "USD",
                        },
                    });
                    const refund = await paypalClient.execute(request);
                    refundResult = { id: refund.result.id, status: refund.result.status };
                }
            }

            // Update items in the sub-order
            const updatedItems = subOrderData.items
                .map((i) =>
                    i.id === cancelRequest.itemId
                        ? { ...i, quantity: i.quantity - cancelRequest.quantity, originalQuantity: i.originalQuantity || i.quantity }
                        : i
                )
                .filter((i) => i.quantity > 0);

            const updatedTotalQuantity = subOrderData.totalQuantity - cancelRequest.quantity;
            const updatedTotalAmount = updatedItems.reduce(
                (sum, i) => sum + i.price * i.quantity,
                0
            );

            // Update cancelRequests status
            const updatedCancelRequests = subOrderData.cancelRequests.map((c) =>
                c.cancelId === cancelId
                    ? { ...c, status: "Approved", approvedAt: admin.firestore.Timestamp.now() }
                    : c
            );

            // Track canceled items
            const updatedCancelledItems = subOrderData.cancelledItems || [];
            updatedCancelledItems.push({
                itemId: cancelRequest.itemId,
                quantity: cancelRequest.quantity,
                reason: cancelRequest.reason,
                cancelledAt: admin.firestore.Timestamp.now(),
                cancelId: cancelId,
                status: "cancelled",
            });

            const updateData = {
                items: updatedItems,
                totalQuantity: updatedTotalQuantity,
                totalAmount: updatedTotalAmount,
                cancelRequests: updatedCancelRequests,
                cancelledItems: updatedCancelledItems,
                cancelledAt: admin.firestore.Timestamp.now(),
                cancelStatus: updatedItems.length === 0 ? "cancelled" : "cancelled",
            };

            if (updatedItems.length === 0) {
                updateData.status = "cancelled";
            }

            if (refundResult) updateData.refundResult = refundResult;

            await subOrderRef.update(updateData);

            // Update total order totals
            const subOrdersSnap = await db
                .collection("subOrders")
                .where("totalOrderId", "==", orderId)
                .get();
            const allSubOrdersCancelled = subOrdersSnap.docs.every(
                (doc) => doc.data().status === "cancelled" || doc.data().status === "cancelDirectly"
            );
            const totalOrderUpdate = {};
            if (allSubOrdersCancelled) {
                totalOrderUpdate.status = "cancelled";
                totalOrderUpdate.cancelledAt = admin.firestore.Timestamp.now();
                totalOrderUpdate.totalQuantity = 0;
                totalOrderUpdate.totalAmount = 0;
                totalOrderUpdate.totalPrice = 0;
            } else {
                let newTotalQuantity = 0;
                let newTotalAmount = 0;
                subOrdersSnap.docs.forEach((doc) => {
                    const subOrder = doc.data();
                    if (subOrder.status !== "cancelled" && subOrder.status !== "cancelDirectly") {
                        newTotalQuantity += subOrder.totalQuantity;
                        newTotalAmount += subOrder.totalAmount;
                    }
                });

                totalOrderUpdate.totalQuantity = newTotalQuantity;
                totalOrderUpdate.totalAmount = newTotalAmount;
                totalOrderUpdate.totalPrice =
                    newTotalAmount + totalOrderData.totalShipping + totalOrderData.totalTax;
            }

            await totalOrderRef.update(totalOrderUpdate);

            await db.collection("sellerNotifications").add({
                sellerId: subOrderData.sellerId,
                type: "cancel_processed",
                message: `Cancellation of ${cancelRequest.quantity} of ${item.productName} in sub-order ${subOrderId} has been approved.`,
                userId: subOrderData.userId,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            // Notify user
            await db.collection("userNotifications").add({
                userId: subOrderData.userId,
                imgUrl: item.imgUrl || "",
                type: "order_cancelled",
                message: `Your cancellation request for ${cancelRequest.quantity} of ${item.productName} in order ${orderId} has been approved.`,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            res.status(200).json({ 
                message: "Cancellation request approved successfully",
                updatedTotalOrder: {
                    totalQuantity: totalOrderUpdate.totalQuantity || totalOrderData.totalQuantity,
                    totalAmount: totalOrderUpdate.totalAmount || totalOrderData.totalAmount,
                    totalPrice: totalOrderUpdate.totalPrice || totalOrderData.totalPrice,
                    status: totalOrderUpdate.status || totalOrderData.status,
                },
            });
        } else if (action === "reject") {
            const updatedCancelRequests = subOrderData.cancelRequests.map((c) =>
                c.cancelId === cancelId
                    ? { ...c, status: "Rejected", rejectedAt: admin.firestore.Timestamp.now() }
                    : c
            );

            await subOrderRef.update({
                cancelRequests: updatedCancelRequests,
                cancelStatus: updatedCancelRequests.some(c => c.status === "Requested") ? "Requested" : "None",
            });

            await db.collection("sellerNotifications").add({
                sellerId: subOrderData.sellerId,
                type: "cancel_rejected",
                message: `Cancellation request for ${cancelRequest.quantity} of ${item.productName} in sub-order ${subOrderId} has been rejected.`,
                userId: subOrderData.userId,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            await db.collection("userNotifications").add({
                userId: subOrderData.userId,
                imgUrl: item.imgUrl || "",
                type: "cancel_rejected",
                message: `Your cancellation request for ${cancelRequest.quantity} of ${item.productName} in order ${orderId} has been rejected.`,
                totalOrderId: orderId,
                subOrderId: subOrderId,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
            });

            res.status(200).json({ message: "Cancellation request rejected successfully" });
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error processing cancellation request", error: error.message });
    }
};

const requestAppeal = async (req, res) => {
    try {
        const db = getDb();
        const { orderId, subOrderId } = req.params;
        const { reason, evidence, itemId, quantity, refundId, itemDetails } = req.body;

        if (!reason || !itemId || !quantity || !refundId) {
            return res.status(400).json({ message: "Missing required fields: reason, itemId, quantity, or refundId" });
        }

        const subOrderRef = db.collection("subOrders").doc(subOrderId);
        const subOrderSnap = await subOrderRef.get();
        if (!subOrderSnap.exists) {
            return res.status(404).json({ message: "Sub-order not found" });
        }
        const subOrderData = subOrderSnap.data();

        const refundItem = (subOrderData.refundItems || []).find(
            r => r.itemId === itemId && r.quantity === quantity && r.refundId === refundId && r.status === "Rejected"
        );
        if (!refundItem) {
            return res.status(400).json({ message: "Can only appeal a rejected refund with matching item and quantity" });
        }

        const appealData = {
            reason,
            evidence: evidence || [],
            itemId,
            quantity,
            refundId,
            itemDetails,
            requestedAt: admin.firestore.Timestamp.now(),
            status: "Pending"
        };

        await subOrderRef.update({
            appealRequested: true,
            appealReason: reason,
            appealData,
            appealRequestedAt: admin.firestore.Timestamp.now(),
        });

        // Create admin notification
        await db.collection("adminNotifications").add({
            type: "appeal_request",
            message: `New appeal request for refund in sub-order ${subOrderId}`,
            orderId,
            subOrderId,
            sellerId: subOrderData.sellerId,
            createdAt: admin.firestore.Timestamp.now(),
            isRead: false,
        });

        res.status(200).json({ message: "Appeal submitted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error submitting appeal", error: error.message });
    }
};

module.exports = {
    getDb,
    getOrders,
    createOrder,
    getOrderById,
    updateOrder,
    createStripePaymentIntent,
    requestRefund,
    processRefund,
    cancelOrder,
    processCancelRequest,
    requestAppeal,
    customerConfirmReturn,
    getSubOrders,
    getPendingOrders,
    confirmDelivery
};