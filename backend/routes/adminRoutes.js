const express = require("express");
const {
    getAdminProfileById,
    updateAdminPhoto,
    updateAdminPassword,
    updateAdminProfile,
    getPendingOrders,
    approvePendingOrder,
    rejectPendingOrder,
    getAllOrders,
    getAllSellers,
    deleteSeller,
    getAllUsers,
    deleteUser,
    getDashboardData,
} = require("../controllers/adminController");

const router = express.Router();

// Profile Admin
router.get("/:id/profile", getAdminProfileById);
router.put(":id/photo", updateAdminPhoto);
router.put("/:id/password", updateAdminPassword);
router.put("/:id/profile", updateAdminProfile);

// Pending Orders & Notifications
router.get("/pending-orders", getPendingOrders);
router.post("/pending-orders/:id/approve", approvePendingOrder);
router.delete("/pending-orders/:id/reject", rejectPendingOrder);

// Orders
router.get("/orders", getAllOrders);

// Sellers
router.get("/sellers", getAllSellers);
router.delete("/sellers/:id", deleteSeller);

// Users
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

// Dashboard
router.get("/dashboard", getDashboardData);

module.exports = router;
