const express = require("express");
const { getAllUsers, getUserById, updateUserById, getUserProfileById } = require("../controllers/userController");
const { authenticateUser } = require('../controllers/authController');
const router = express.Router();

// // Bảo vệ tất cả các routes với middleware authenticateUser
// router.use(authenticateUser);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUserById);
router.get("/:id/profile", getUserProfileById);

module.exports = router;