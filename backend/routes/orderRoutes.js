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
    processCancelRequest,
    requestAppeal,
} = require("../controllers/orderController");
const { authenticateUser } = require("../controllers/authController");
const router = express.Router();

router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:orderId", getOrderById);
router.put("/:orderId", updateOrder);
router.post("/:orderId/stripe-payment-intent", createStripePaymentIntent);
router.post("/:orderId/refund/:subOrderId", requestRefund);
router.put("/:orderId/refund/:subOrderId", processRefund);
router.post("/:orderId/cancel/:subOrderId", cancelOrder);
router.put("/:orderId/cancel/process/:subOrderId", processCancelRequest);
router.post("/:orderId/sub-orders/:subOrderId/appeal", requestAppeal);

module.exports = router;
