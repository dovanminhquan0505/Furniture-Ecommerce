const admin = require("firebase-admin");
const db = admin.firestore();

/* Profile Admin */
exports.getAdminProfileById = async (req, res) => {
    try {
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

exports.updateAdminProfile = async (req, res) => {
    try {
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

exports.updateAdminPhoto = async (req, res) => {
    try {
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

exports.updateAdminPassword = async (req, res) => {
    try {
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
exports.getPendingOrders = async (req, res) => {
    try {
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

exports.approvePendingOrder = async (req, res) => {
    try {
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
            email: orderData.email,
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
            status: "seller",
            sellerId: sellerId,
        });

        await db.collection("pendingOrders").doc(id).delete();
        res.status(200).json({ message: "Seller account approved and created successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.rejectPendingOrder = async (req, res) => {
    try {
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
exports.getAllOrders = async (req, res) => {
    try {
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
exports.getAllSellers = async (req, res) => {
    try {
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

exports.deleteSeller = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection("sellers").doc(id).delete();
        res.status(200).json({ message: "Seller deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* Users */
exports.getAllUsers = async (req, res) => {
    try {
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

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection("users").doc(id).delete();
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* Dashboard */
exports.getDashboardData = async (req, res) => {
    try {
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