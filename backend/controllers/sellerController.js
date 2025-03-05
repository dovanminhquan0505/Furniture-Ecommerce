const admin = require("firebase-admin");
const db = admin.firestore();

exports.getAllSellers = [async (req, res) => {
  try {
    const snapshot = await db.collection("sellers").get();
    const sellers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(sellers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}];

exports.getSellerById = async (req, res) => {
  try {
    const sellerDoc = await db.collection('sellers').doc(req.params.sellerId).get();
    if (!sellerDoc.exists) return res.status(404).json({ message: 'Seller not found' });
    res.json(sellerDoc.data());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seller info', error });
  }
};

exports.getSellerInfo = async (req, res) => {
    try {
      const sellerDoc = await db.collection('sellers').doc(req.params.sellerId).get();
      if (!sellerDoc.exists) return res.status(404).json({ message: 'Seller not found' });
      res.json(sellerDoc.data());
    } catch (error) {
      res.status(500).json({ message: 'Error fetching seller info', error });
    }
};

exports.updateSellerInfo = async (req, res) => {
    try {
      const sellerRef = db.collection('sellers').doc(req.params.sellerId);
      const sellerDoc = await sellerRef.get();
      if (!sellerDoc.exists) return res.status(404).json({ message: 'Seller not found' });
  
      await sellerRef.update(req.body);
      const updatedDoc = await sellerRef.get();
      res.json(updatedDoc.data());
    } catch (error) {
      res.status(500).json({ message: 'Error updating seller info', error });
    }
  };
  
  exports.getCurrentSeller = async (req, res) => {
    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
  
      const sellerId = userDoc.data().sellerId;
      const sellerDoc = await db.collection('sellers').doc(sellerId).get();
      if (!sellerDoc.exists) return res.status(404).json({ message: 'Seller not found' });
  
      res.json(sellerDoc.data());
    } catch (error) {
      res.status(500).json({ message: 'Error fetching current seller', error });
    }
  };