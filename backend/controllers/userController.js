const admin = require("firebase-admin");
const db = admin.firestore();
const { authenticateUser, requireAdmin } = require('./authController');

// Lấy tất cả người dùng
exports.getAllUsers = [authenticateUser, async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}];

// Lấy thông tin của người dùng hiện tại
exports.getCurrentUser = [authenticateUser, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userData = userDoc.data();
    
    res.status(200).json({
      id: userDoc.id,
      ...userData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}];

// Cập nhật thông tin người dùng
exports.updateUser = [authenticateUser, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { displayName, photoURL } = req.body;
    
    // Chỉ cho phép cập nhật các trường cụ thể
    const updateData = {};
    
    if (displayName) updateData.displayName = displayName;
    if (photoURL) updateData.photoURL = photoURL;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    
    // Cập nhật user trong Firestore
    await db.collection("users").doc(uid).update(updateData);
    
    // Cập nhật user trong Firebase Auth nếu cần
    if (displayName || photoURL) {
      const updateAuthData = {};
      if (displayName) updateAuthData.displayName = displayName;
      if (photoURL) updateAuthData.photoURL = photoURL;
      
      await admin.auth().updateUser(uid, updateAuthData);
    }
    
    res.status(200).json({ 
      message: "User updated successfully",
      updatedFields: Object.keys(updateData)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}];

exports.getUserProfile = [authenticateUser, async (req, res) => {
  try {
    const uid = req.user.uid;

    const userDoc = await db.collection("users").doc(uid).get();

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
      role: userData.role || "user",
      photoURL: userData.photoURL || "",
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: error.message });
  }
}];