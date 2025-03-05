const express = require("express");
const { getOrders, createOrder, getSellerOrders, confirmDelivery, deleteOrder } = require("../controllers/orderController");
const { requireSeller } = require('../controllers/authController'); 
const router = express.Router();

router.get("/", getOrders);
router.post("/", createOrder);
router.get('/:sellerId/orders', getSellerOrders);
router.put('/:orderId/deliver', confirmDelivery);
router.delete('/:orderId', deleteOrder);

module.exports = router;