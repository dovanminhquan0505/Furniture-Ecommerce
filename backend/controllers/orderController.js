const admin = require("firebase-admin");
const db = admin.firestore();

exports.getOrders = async (req, res) => {
  try {
    const snapshot = await db.collection("totalOrders").get();
    const totalOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    } = req.body;

    const newOrder = await db.collection("totalOrders").add({
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
      createdAt: admin.firestore.Timestamp.now(),
      sellerIds,
    });
    res.status(201).json({ id: newOrder.id, message: "Order created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/******************** SELLER ********************/
exports.getSellerOrders = async (req, res) => {
  try {
    const ordersSnapshot = await db
      .collection('subOrders')
      .where('sellerId', '==', req.params.sellerId)
      .get();
    const orders = await Promise.all(
      ordersSnapshot.docs.map(async doc => {
        const orderData = doc.data();
        const totalOrderDoc = await db.collection('totalOrders').doc(orderData.totalOrderId).get();
        const userName = totalOrderDoc.exists ? totalOrderDoc.data().billingInfo?.name || 'Unknown' : 'Unknown';
        return { id: doc.id, ...orderData, userName };
      })
    );
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

exports.confirmDelivery = async (req, res) => {
  try {
    const orderRef = db.collection('subOrders').doc(req.params.orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ message: 'Order not found' });

    await orderRef.update({
      isDelivered: true,
      deliveredAt: new Date(),
    });
    const updatedDoc = await orderRef.get();
    res.json(updatedDoc.data());
  } catch (error) {
    res.status(500).json({ message: 'Error confirming delivery', error });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const orderRef = db.collection('subOrders').doc(req.params.orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ message: 'Order not found' });

    await orderRef.delete();
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error });
  }
};