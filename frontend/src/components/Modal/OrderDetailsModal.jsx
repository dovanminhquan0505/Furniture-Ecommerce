import React from "react";
import { Button } from "react-bootstrap";
import "./OrderDetailsModal.css";

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    // Map trạng thái đơn hàng với màu sắc
    const statusStyles = {
        pending: { background: "#ffe58f", color: "#d46b08" },
        shipping: { background: "#91d5ff", color: "#096dd9" },
        success: { background: "#b7eb8f", color: "#389e0d" },
        cancelled: { background: "#ffccc7", color: "#cf1322" },
        Refunded: { background: "#d9d9d9", color: "#595959" },
    };

    const statusStyle = statusStyles[order.status] || {
        background: "#f5f5f5",
        color: "#000",
    };

    // Hàm định dạng ngày giờ
    const formatDate = (dateString) => {
        if (!dateString || dateString === "No") return "Not Paid";
        try {
            const date = new Date(dateString);
            if (isNaN(date)) return "Invalid Date";
            // Định dạng: "DD/MM/YYYY HH:mm:ss"
            return date.toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });
        } catch {
            return "Invalid Date";
        }
    };

    return (
        <div className="order-details-modal-overlay">
            <div className="order-details-modal-content">
                <button
                    className="order-details-modal-close-btn"
                    onClick={onClose}
                >
                    ×
                </button>
                <div className="order-details-modal-header">
                    <h4>Order Details</h4>
                    <span
                        className="order-status-badge"
                        style={{
                            backgroundColor: statusStyle.background,
                            color: statusStyle.color,
                        }}
                    >
                        {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                    </span>
                </div>
                <div className="order-details-modal-body">
                    <div className="order-details-section">
                        <h5>Shipping Information</h5>
                        <p>
                            <strong>Name:</strong>{" "}
                            {order.billingInfo?.recipientName || "Not Provided"}
                        </p>
                        <p>
                            <strong>Phone:</strong>{" "}
                            {order.billingInfo?.phone || "Not Provided"}
                        </p>
                        <p>
                            <strong>Address:</strong>{" "}
                            {order.billingInfo?.address || "Not Provided"}
                        </p>
                        <p>
                            <strong>Email:</strong>{" "}
                            {order.billingInfo?.email || "Not Provided"}
                        </p>
                        <p>
                            <strong>Paid At:</strong> {formatDate(order.paidAt)}
                        </p>
                    </div>
                    <div className="order-details-section">
                        <h5>Product Information</h5>
                        <p>
                            <strong>Store:</strong>{" "}
                            {order.storeName || "Not Provided"}
                        </p>
                        <div className="product-info-container">
                            <img
                                src={
                                    order.productImage ||
                                    "https://via.placeholder.com/100"
                                }
                                alt={order.productName}
                                className="product-image"
                                onError={(e) => {
                                    e.target.src =
                                        "https://via.placeholder.com/100";
                                }}
                            />
                            <div className="product-details">
                                <p>
                                    <strong>Product:</strong>{" "}
                                    {order.productName || "Not Provided"}
                                </p>
                                <p>
                                    <strong>Quantity:</strong>{" "}
                                    {order.quantity || 0}
                                </p>
                                <p>
                                    <strong>Price:</strong> ${order.price || 0}
                                </p>
                                <p>
                                    <strong>Total:</strong> $
                                    {order.totalPrice || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="order-details-modal-footer">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;
