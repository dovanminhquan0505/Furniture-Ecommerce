const admin = require("firebase-admin");
const db = admin.firestore();

// Lấy tất cả người dùng
exports.getAllUsers = [
    async (req, res) => {
        try {
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
exports.getUserById = async (req, res) => {
    try {
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
exports.updateUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const { displayName, photoURL } = req.body;

        const updateData = {};
        if (displayName) updateData.displayName = displayName;
        if (photoURL) updateData.photoURL = photoURL;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }

        await db.collection("users").doc(id).update(updateData);

        if (displayName || photoURL) {
            const updateAuthData = {};
            if (displayName) updateAuthData.displayName = displayName;
            if (photoURL) updateAuthData.photoURL = photoURL;

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

exports.getUserProfileById = async (req, res) => {
    try {
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

exports.updateUserPhoto = async (req, res) => {
    try {
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

exports.updateUserPassword = async (req, res) => {
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

exports.getUserOrders = async (req, res) => {
    try {
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
                ? doc.data().paidAt.toDate().toISOString().split("T")[0]
                : "No",
            deliveredAt: doc.data().isDelivered
                ? doc.data().deliveredAt.toDate().toISOString().split("T")[0]
                : "No",
        }));
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteUserOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        await db.collection("totalOrders").doc(orderId).delete();
        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
