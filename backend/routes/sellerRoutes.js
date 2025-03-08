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
    confirmDelivery,
    deleteSellerOrder,
} = require("../controllers/sellerController");
const { getDashboardStats } = require("../controllers/dashboardController");
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
router.put('/:orderId/deliver', confirmDelivery);
router.delete('/:sellerId/orders/:orderId', deleteSellerOrder);

module.exports = router;
