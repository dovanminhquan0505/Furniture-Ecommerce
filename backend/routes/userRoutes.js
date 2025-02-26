const express = require("express");
const { getAllUsers, getCurrentUser, updateUser, getUserProfile } = require("../controllers/userController");
const { authenticateUser } = require('../controllers/authController');
const router = express.Router();

// Bảo vệ tất cả các routes với middleware authenticateUser
router.use(authenticateUser);

// Lấy tất cả người dùng (chỉ admin)
router.get("/", getAllUsers);

// Lấy thông tin người dùng hiện tại
router.get("/me", getCurrentUser);

// Lấy thông tin profile người dùng
router.get("/me/profile", getUserProfile);

// Cập nhật thông tin người dùng
router.put("/me", updateUser);

module.exports = router;