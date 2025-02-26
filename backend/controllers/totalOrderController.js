const admin = require("firebase-admin");
const db = admin.firestore();

exports.getOrders = async (req, res) => {
  try {
    const snapshot = await db.collection("totalOrders").get();
    const totalOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(totalOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { userId, items, total } = req.body;
    const newOrder = await db.collection("totalOrders").add({
      userId,
      items,
      total,
      createdAt: admin.firestore.Timestamp.now(),
    });
    res.status(201).json({ id: newOrder.id, message: "Order created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};