const admin = require("firebase-admin");
const db = admin.firestore();

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
        const subOrderRef = db.collection("subOrders").doc(subOrderId);
        const subOrderSnap = await subOrderRef.get();
        if (!subOrderSnap.exists) return;

        const subOrderData = subOrderSnap.data();
        if (subOrderData.status !== currentStatus) return;

        let newStatus;
        if (currentStatus === "processing") newStatus = "shipping";
        else if (currentStatus === "shipping") newStatus = "success";

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

            if (newStatus === "shipping") {
                scheduleStatusUpdate(orderId, subOrderId, "shipping", 300000);
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

exports.getOrders = async (req, res) => {
    try {
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

exports.createOrder = async (req, res) => {
    try {
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
        const subOrdersRef = db.collection("subOrders");
        await Promise.all(
            Object.values(subOrders).map((subOrder) =>
                subOrdersRef.add(subOrder)
            )
        );

        res.status(201).json({
            id: totalOrderId,
            message: "Order and sub-orders created successfully",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
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
exports.updateOrder = async (req, res) => {
    try {
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
                scheduleStatusUpdate(orderId, subOrderId, "processing", 300000);
            } else if (status === "shipping") {
                scheduleStatusUpdate(orderId, subOrderId, "shipping", 300000);
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
exports.createStripePaymentIntent = async (req, res) => {
    try {
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

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({
            message: "Error creating Stripe payment intent",
            error: error.message,
        });
    }
};

// Refund
exports.requestRefund = async (req, res) => {
    try {
        const { orderId, subOrderId } = req.params;
        const { reason, evidence } = req.body;

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

        if (subOrderData.refundStatus === "Refunded") {
            return res.status(400).json({ message: "Sub-order has already been refunded" });
        }

        if (subOrderData.status !== "success") {
            return res.status(400).json({ message: "Refund can only be requested for successful orders" });
        }

        const deliveredAt = totalOrderData.deliveredAt?.toDate(); 
        if (!deliveredAt) {
            return res.status(400).json({ message: "Order has not been delivered yet" });
        }
        const now = new Date();
        const daysSinceDelivered = (now - deliveredAt) / (1000 * 60 * 60 * 24);
        if (daysSinceDelivered > 15) {
            return res.status(400).json({ message: "Refund request period (15 days from delivery) has expired" });
        }

        const refundData = {
            refundStatus: "Requested",
            refundRequest: {
                reason,
                evidence: evidence || [],
                requestedAt: admin.firestore.Timestamp.now(),
                isReturnRequired: true,
            },
        };

        await subOrderRef.update(refundData);

        res.status(200).json({ message: "Return & Refund request submitted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error requesting refund", error: error.message });
    }
};

exports.processRefund = async (req, res) => {
    try {
        const { orderId, subOrderId } = req.params;
        const { action, returnReceived } = req.body;

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

        if (subOrderData.refundStatus !== "Requested") {
            return res.status(400).json({ message: "No refund request pending" });
        }

        let updateData = {};
        let totalOrderUpdateData = null;

        if (action === "approve") {
            if (subOrderData.refundRequest.isReturnRequired && !returnReceived) {
                updateData = { refundStatus: "Return Requested" };
                await subOrderRef.update(updateData);
                return res.status(200).json({ message: "Return requested, awaiting confirmation" });
            }

            updateData = {
                refundStatus: returnReceived ? "Refunded" : "Return Received",
                refundedAt: returnReceived ? admin.firestore.Timestamp.now() : null,
                returnReceivedAt: returnReceived ? null : admin.firestore.Timestamp.now(),
            };

            if (returnReceived) {
                const paymentResult = totalOrderData.paymentResult;
                const refundAmount = subOrderData.totalAmount;
                if (paymentResult && totalOrderData.paymentMethod === "stripe") {
                    const refund = await stripe.refunds.create({
                        payment_intent: paymentResult.id,
                        amount: Math.round(refundAmount * 100),
                    });
                    updateData.refundResult = { id: refund.id, status: refund.status };
                } else if (paymentResult && totalOrderData.paymentMethod === "paypal") {
                    const request = new paypal.payments.CapturesRefundRequest(paymentResult.id);
                    request.requestBody({
                        amount: { value: refundAmount.toString(), currency_code: "USD" },
                    });
                    const refund = await paypalClient.execute(request);
                    updateData.refundResult = { id: refund.result.id, status: refund.result.status };
                }

                // Loại bỏ sản phẩm khỏi totalOrder.items
                const updatedItems = totalOrderData.items.filter(
                    (item) => !subOrderData.items.some((subItem) => subItem.id === item.id)
                );
                const subOrderAmount = subOrderData.totalAmount;
                const subOrderQuantity = subOrderData.totalQuantity;

                const newTotalAmount = totalOrderData.totalAmount - subOrderAmount;
                const newTotalQuantity = totalOrderData.totalQuantity - subOrderQuantity;
                const newTotalShipping = newTotalAmount > 100 ? 0 : 10;
                const newTotalTax = Math.round((0.15 * newTotalAmount * 100) / 100);
                const newTotalPrice = newTotalAmount + newTotalShipping + newTotalTax;

                totalOrderUpdateData = {
                    items: updatedItems,
                    totalAmount: newTotalAmount,
                    totalQuantity: newTotalQuantity,
                    totalShipping: newTotalShipping,
                    totalTax: newTotalTax,
                    totalPrice: newTotalPrice,
                };

                await totalOrderRef.update(totalOrderUpdateData);
            }

            await subOrderRef.update(updateData);
            res.status(200).json({ 
                message: returnReceived ? "Refund approved successfully" : "Return received, awaiting final refund",
                updatedTotalOrder: totalOrderUpdateData
            });
        } else if (action === "reject") {
            updateData = {
                refundStatus: "Rejected",
                rejectedAt: admin.firestore.Timestamp.now(),
            };
            await subOrderRef.update(updateData);
            res.status(200).json({ message: "Refund rejected successfully" });
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error processing refund", error: error.message });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const { orderId, subOrderId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: "Reason for cancellation is required" });
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

        if (subOrderData.status === "success" || subOrderData.isDelivered) {
            return res.status(400).json({ message: "Cannot cancel order after it has been delivered. Please request a refund instead." });
        }

        if (subOrderData.cancelStatus === "Approved" || subOrderData.status === "cancelled") {
            return res.status(400).json({ message: "Order has already been cancelled" });
        }

        let updateData;

        // Nếu trạng thái là "pending", hủy ngay lập tức
        if (subOrderData.status === "pending") {
            updateData = {
                status: "cancelled",
                cancelReason: reason,
                cancelStatus: "Approved",
                cancelledAt: admin.firestore.Timestamp.now(),
            };

            if (totalOrderData.isPaid) {
                const refundAmount = subOrderData.totalAmount;
                const paymentResult = totalOrderData.paymentResult;
                if (paymentResult && totalOrderData.paymentMethod === "stripe") {
                    const refund = await stripe.refunds.create({
                        payment_intent: paymentResult.id,
                        amount: Math.round(refundAmount * 100),
                    });
                    updateData.refundResult = { id: refund.id, status: refund.status };
                    updateData.refundedAt = admin.firestore.Timestamp.now();
                } else if (paymentResult && totalOrderData.paymentMethod === "paypal") {
                    if (!paymentResult.id) {
                        throw new Error("Capture ID not found in paymentResult");
                    }
                    const request = new paypal.payments.CapturesRefundRequest(paymentResult.id);
                    request.requestBody({
                        amount: { value: refundAmount.toString(), currency_code: "USD" },
                    });
                    const refund = await paypalClient.execute(request);
                    updateData.refundResult = { id: refund.result.id, status: refund.result.status };
                    updateData.refundedAt = admin.firestore.Timestamp.now();
                }
                updateData.refundStatus = "Refunded";
            }

            await subOrderRef.update(updateData);

            // Cập nhật totalOrder: Loại bỏ items của sub-order và tính lại giá
            const updatedItems = totalOrderData.items.filter(
                (item) => !subOrderData.items.some((subItem) => subItem.id === item.id)
            );
            const subOrderAmount = subOrderData.totalAmount;
            const subOrderQuantity = subOrderData.totalQuantity;

            const newTotalAmount = totalOrderData.totalAmount - subOrderAmount;
            const newTotalQuantity = totalOrderData.totalQuantity - subOrderQuantity;
            const newTotalShipping = newTotalAmount > 100 ? 0 : 10;
            const newTotalTax = Math.round((0.15 * newTotalAmount * 100) / 100);
            const newTotalPrice = newTotalAmount + newTotalShipping + newTotalTax;

            const totalOrderUpdateData = {
                items: updatedItems,
                totalAmount: newTotalAmount,
                totalQuantity: newTotalQuantity,
                totalShipping: newTotalShipping,
                totalTax: newTotalTax,
                totalPrice: newTotalPrice,
            };

            // Kiểm tra nếu tất cả subOrders đều cancelled thì cập nhật status
            const subOrdersSnap = await db.collection("subOrders")
                .where("totalOrderId", "==", orderId)
                .get();
            const allSubOrdersCancelled = subOrdersSnap.docs.every(doc => 
                doc.data().status === "cancelled" || doc.data().cancelStatus === "Approved"
            );
            if (allSubOrdersCancelled) {
                totalOrderUpdateData.status = "cancelled";
                totalOrderUpdateData.cancelledAt = admin.firestore.Timestamp.now();
            }

            await totalOrderRef.update(totalOrderUpdateData);

            res.status(200).json({ 
                message: "Sub-order cancelled successfully",
                updatedTotalOrder: totalOrderUpdateData 
            });
        } 
        // Nếu trạng thái là "processing", yêu cầu phê duyệt từ seller
        else if (subOrderData.status === "processing") {
            updateData = {
                cancelStatus: "Requested",
                cancelReason: reason,
                cancelRequestedAt: admin.firestore.Timestamp.now(),
            };

            await subOrderRef.update(updateData);

            res.status(200).json({ message: "Cancellation request submitted, awaiting seller approval" });
        } else {
            return res.status(400).json({ message: "Cancellation not allowed for this order status" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error cancelling order", error: error.message });
    }
};

exports.processCancelRequest = async (req, res) => {
    try {
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

        if (subOrderData.cancelStatus !== "Requested") {
            return res.status(400).json({ message: "No cancellation request pending" });
        }

        let updateData = {};
        if (action === "approve") {
            updateData = {
                status: "cancelled",
                cancelStatus: "Approved",
                cancelledAt: admin.firestore.Timestamp.now(),
            };

            if (totalOrderData.isPaid) {
                const refundAmount = subOrderData.totalAmount;
                const paymentResult = totalOrderData.paymentResult;
                if (paymentResult && totalOrderData.paymentMethod === "stripe") {
                    const refund = await stripe.refunds.create({
                        payment_intent: paymentResult.id,
                        amount: Math.round(refundAmount * 100),
                    });
                    updateData.refundResult = { id: refund.id, status: refund.status };
                    updateData.refundedAt = admin.firestore.Timestamp.now();
                } else if (paymentResult && totalOrderData.paymentMethod === "paypal") {
                    const request = new paypal.payments.CapturesRefundRequest(paymentResult.id);
                    request.requestBody({
                        amount: { value: refundAmount.toString(), currency_code: "USD" },
                    });
                    const refund = await paypalClient.execute(request);
                    updateData.refundResult = { id: refund.result.id, status: refund.result.status };
                    updateData.refundedAt = admin.firestore.Timestamp.now();
                }
                updateData.refundStatus = "Refunded";
            }

            await subOrderRef.update(updateData);

            // Cập nhật totalOrder: Loại bỏ items của sub-order và tính lại giá
            const updatedItems = totalOrderData.items.filter(
                (item) => !subOrderData.items.some((subItem) => subItem.id === item.id)
            );
            const subOrderAmount = subOrderData.totalAmount;
            const subOrderQuantity = subOrderData.totalQuantity;

            const newTotalAmount = totalOrderData.totalAmount - subOrderAmount;
            const newTotalQuantity = totalOrderData.totalQuantity - subOrderQuantity;
            const newTotalShipping = newTotalAmount > 100 ? 0 : 10;
            const newTotalTax = Math.round((0.15 * newTotalAmount * 100) / 100);
            const newTotalPrice = newTotalAmount + newTotalShipping + newTotalTax;

            const totalOrderUpdateData = {
                items: updatedItems,
                totalAmount: newTotalAmount,
                totalQuantity: newTotalQuantity,
                totalShipping: newTotalShipping,
                totalTax: newTotalTax,
                totalPrice: newTotalPrice,
            };

            // Kiểm tra nếu tất cả subOrders đều cancelled thì cập nhật status
            const subOrdersSnap = await db.collection("subOrders")
                .where("totalOrderId", "==", orderId)
                .get();
            const allSubOrdersCancelled = subOrdersSnap.docs.every(doc => 
                doc.data().status === "cancelled" || doc.data().cancelStatus === "Approved"
            );
            if (allSubOrdersCancelled) {
                totalOrderUpdateData.status = "cancelled";
                totalOrderUpdateData.cancelledAt = admin.firestore.Timestamp.now();
            }

            await totalOrderRef.update(totalOrderUpdateData);

            res.status(200).json({ 
                message: "Cancellation request approved",
                updatedTotalOrder: totalOrderUpdateData 
            });
        } else if (action === "reject") {
            updateData = {
                cancelStatus: "Rejected",
                cancelRejectedAt: admin.firestore.Timestamp.now(),
            };

            await subOrderRef.update(updateData);

            res.status(200).json({ message: "Cancellation request rejected" });
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error processing cancellation request", error: error.message });
    }
};

exports.requestAppeal = async (req, res) => {
    try {
        const { orderId, subOrderId } = req.params;
        const { reason } = req.body;

        const subOrderRef = db.collection("subOrders").doc(subOrderId);
        const subOrderSnap = await subOrderRef.get();
        if (!subOrderSnap.exists) {
            return res.status(404).json({ message: "Sub-order not found" });
        }
        const subOrderData = subOrderSnap.data();

        if (subOrderData.refundStatus !== "Rejected") {
            return res.status(400).json({ message: "Can only appeal a rejected refund" });
        }

        await subOrderRef.update({
            appealRequested: true,
            appealReason: reason,
            appealRequestedAt: admin.firestore.Timestamp.now(),
        });

        res.status(200).json({ message: "Appeal submitted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error submitting appeal", error: error.message });
    }
};