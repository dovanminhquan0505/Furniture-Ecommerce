const express = require("express");
const { getOrders, createOrder, getOrderById, updateOrder } = require("../controllers/orderController");
const router = express.Router();

router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:orderId", getOrderById);
router.put("/:orderId", updateOrder);

module.exports = router;