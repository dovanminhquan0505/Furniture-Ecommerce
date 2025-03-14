const express = require("express");
const {
    getAllUsers,
    getUserById,
    updateUserById,
    getUserProfileById,
    updateUserPhoto,
    updateUserPassword,
    getUserOrders,
    deleteUserOrder,
} = require("../controllers/userController");
const { authenticateUser } = require("../controllers/authController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// // Bảo vệ tất cả các routes với middleware authenticateUser
// router.use(authenticateUser);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUserById);
router.get("/:id/profile", getUserProfileById);
router.put("/:id/photo", upload.single("file"), updateUserPhoto);
router.put("/:id/password", updateUserPassword);
router.get("/:id/orders", getUserOrders);
router.delete("/orders/:orderId", deleteUserOrder);

module.exports = router;
