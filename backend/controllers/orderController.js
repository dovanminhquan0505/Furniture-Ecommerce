const admin = require("firebase-admin");
const db = admin.firestore();

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
        } = req.body;

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
            createdAt: createdAt
                ? new Date(createdAt)
                : admin.firestore.Timestamp.now(),
            sellerIds,
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
                    createdAt: createdAt
                        ? new Date(createdAt)
                        : admin.firestore.Timestamp.now(),
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
            ...totalOrderSnap.data(),
        };

        const subOrdersRef = db.collection("subOrders");
        const subOrdersSnap = await subOrdersRef
            .where("totalOrderId", "==", orderId)
            .get();

        const subOrdersData = subOrdersSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json({
            totalOrder: totalOrderData,
            subOrders: subOrdersData,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching order details", error });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { isPaid, paidAt, isDelivered, deliveredAt, paymentResult } = req.body;

        const totalOrderRef = db.collection("totalOrders").doc(orderId);
        const totalOrderSnap = await totalOrderRef.get();

        if (!totalOrderSnap.exists) {
            return res.status(404).json({ message: "Order not found" });
        }

        const updateData = {};
        if (isPaid !== undefined) updateData.isPaid = isPaid;
        if (paidAt) updateData.paidAt = new Date(paidAt);
        if (isDelivered !== undefined) updateData.isDelivered = isDelivered;
        if (deliveredAt) updateData.deliveredAt = new Date(deliveredAt);
        if (paymentResult) updateData.paymentResult = paymentResult;

        await totalOrderRef.update(updateData);

        if (isPaid !== undefined || isDelivered !== undefined) {
            const subOrdersRef = db.collection("subOrders");
            const subOrdersSnap = await subOrdersRef
                .where("totalOrderId", "==", orderId)
                .get();

            const updatePromises = subOrdersSnap.docs.map((doc) => {
                const subUpdateData = {};
                if (isPaid !== undefined) subUpdateData.isPaid = isPaid;
                if (paidAt) subUpdateData.paidAt = new Date(paidAt);
                if (isDelivered !== undefined) subUpdateData.isDelivered = isDelivered;
                if (deliveredAt) subUpdateData.deliveredAt = new Date(deliveredAt);
                return doc.ref.update(subUpdateData);
            });

            await Promise.all(updatePromises);
        }

        res.status(200).json({ message: "Order updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating order", error });
    }
};