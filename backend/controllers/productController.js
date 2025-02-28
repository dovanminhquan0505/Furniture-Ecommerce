const admin = require("firebase-admin");
const db = admin.firestore();

const getProducts = async (req, res) => {
    try {
        const snapshot = await db.collection("products").get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
    }
};

module.exports = { getProducts };