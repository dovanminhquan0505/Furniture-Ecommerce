const express = require("express");
const { getOrders, createOrder, getOrderById, updateOrder, createStripePaymentIntent } = require("../controllers/orderController");
const router = express.Router();

router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:orderId", getOrderById);
router.put("/:orderId", updateOrder);
router.post("/:orderId/stripe-payment-intent", createStripePaymentIntent);

module.exports = router;