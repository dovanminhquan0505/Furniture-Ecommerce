const admin = require("firebase-admin");
const db = admin.firestore();

exports.getAllSellers = [
    async (req, res) => {
        try {
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

exports.getSellerById = async (req, res) => {
    try {
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

exports.getSellerInfo = async (req, res) => {
    try {
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

exports.getSellerProducts = async (req, res) => {
    try {
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

exports.updateSellerProduct = async (req, res) => {
    try {
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

exports.createSellerProduct = async (req, res) => {
    try {
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

exports.deleteSellerProduct = async (req, res) => {
    try {
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

exports.getSellerOrders = async (req, res) => {
    try {
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
                    refundStatus: orderData.refundStatus || "None", 
                };
            })
        );
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
    }
};

exports.deleteSellerOrder = async (req, res) => {
    try {
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

exports.updateSellerInfo = async (req, res) => {
    try {
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

exports.getCurrentSeller = async (req, res) => {
    try {
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

exports.getSellerIdByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const sellerSnapshot = await db.collection("sellers")
            .where("userId", "==", userId)
            .limit(1)
            .get();

        if (sellerSnapshot.empty) {
            return res.status(200).json({ sellerId: null }); // Trả về null nếu không tìm thấy
        }

        const sellerData = sellerSnapshot.docs[0].data();
        res.status(200).json({ sellerId: sellerData.sellerId || sellerSnapshot.docs[0].id }); // Trả về sellerId hoặc Document ID
    } catch (error) {
        console.error("Error fetching seller by user:", error);
        res.status(500).json({ message: "Error fetching seller info", error });
    }
};
