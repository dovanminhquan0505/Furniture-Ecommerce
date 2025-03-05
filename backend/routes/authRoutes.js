const express = require("express");
const {
    registerUser,
    loginUser,
    logoutUser,
    googleLogin,
    authenticateUser,
    requireAdmin,
    refreshToken,
    registerSeller,
} = require("../controllers/authController");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/google-login", googleLogin);
router.post('/seller/register', registerSeller);

// Route bảo vệ (example) - yêu cầu xác thực
router.get("/user", authenticateUser, (req, res) => {
    res.status(200).json({ 
        message: "Authenticated user",
        user: req.user
    });
});

// Route bảo vệ (example) - yêu cầu xác thực + quyền admin
router.get("/admin", authenticateUser, requireAdmin, (req, res) => {
    res.status(200).json({ 
        message: "Admin access granted",
        user: req.user
    });
});

router.post("/refresh-token", authenticateUser, refreshToken);

module.exports = router;
