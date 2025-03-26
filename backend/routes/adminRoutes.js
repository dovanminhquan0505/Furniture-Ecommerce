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
    getRefundDisputes,
    resolveRefundDispute,
} = require("../controllers/adminController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Profile Admin
router.get("/:id/profile", getAdminProfileById);
router.put("/:id/photo", upload.single("file"), updateAdminPhoto);
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

// Refund Disputes
router.get("/refund-disputes", getRefundDisputes);
router.put("/refund-disputes/:orderId/:subOrderId" , resolveRefundDispute);

module.exports = router;
