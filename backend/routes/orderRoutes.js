const express = require("express");
const {
    getOrders,
    createOrder,
    getOrderById,
    updateOrder,
    createStripePaymentIntent,
    requestRefund,
    processRefund,
    cancelOrder,
} = require("../controllers/orderController");
const router = express.Router();

router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:orderId", getOrderById);
router.put("/:orderId", updateOrder);
router.post("/:orderId/stripe-payment-intent", createStripePaymentIntent);
router.post("/:orderId/refund", requestRefund);
router.put("/:orderId/refund", processRefund);
router.post("/:orderId/cancel", cancelOrder);

module.exports = router;
