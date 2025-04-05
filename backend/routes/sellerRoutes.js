const express = require("express");
const {
    getSellerInfo,
    updateSellerInfo,
    getCurrentSeller,
    getAllSellers,
    getSellerById,
    getSellerProducts,
    updateSellerProduct,
    createSellerProduct,
    deleteSellerProduct,
    getSellerOrders,
    deleteSellerOrder,
    getSellerIdByUserId,
    getDashboardStats,
} = require("../controllers/sellerController");
const { requireSeller } = require("../controllers/authController");
const router = express.Router();

// router.use(requireSeller);

router.get("/", getAllSellers);
router.get("/me", getCurrentSeller);
router.get("/:sellerId", getSellerById);
router.get("/:sellerId/store", getSellerInfo);
router.put("/:sellerId/store", updateSellerInfo);
router.get("/:sellerId/products", getSellerProducts);
router.post("/:sellerId/products", createSellerProduct);
router.put('/:productId/products', updateSellerProduct);
router.delete('/:productId', deleteSellerProduct);
router.get("/:sellerId/dashboard", getDashboardStats);
router.get('/:sellerId/orders', getSellerOrders);
router.delete('/:sellerId/orders/:orderId', deleteSellerOrder);
router.get("/by-user/:userId", getSellerIdByUserId)

module.exports = router;
