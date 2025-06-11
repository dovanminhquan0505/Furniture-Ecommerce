import React from "react";
import { Button } from "react-bootstrap";
import "./OrderDetailsModal.css";

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    const statusStyles = {
        pending: { background: "#ffe58f", color: "#d46b08" },
        shipping: { background: "#91d5ff", color: "#096dd.ma" },
        success: { background: "#b7eb8f", color: "#389e0d" },
        cancelled: { background: "#ffccc7", color: "#cf1322" },
        Returned: { background: "#d9d9d9", color: "#595959" },
    };

    const displayStatus = order.cancelStatus === "cancelDirectly" || order.cancelStatus === "cancelled"
        ? "cancelled"
        : order.refundStatus === "Refunded"
        ? "Returned"
        : order.status;

    const statusStyle = statusStyles[displayStatus] || {
        background: "#f5f5f5",
        color: "#000",
    };

    const formatDate = (dateInput) => {
        if (!dateInput || dateInput === "No") return "Not Provided";
        
        try {
            let date;
            if (dateInput && typeof dateInput === 'object' && dateInput._seconds) {
                date = new Date(dateInput._seconds * 1000);
            } else if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
                date = new Date(dateInput.seconds * 1000);
            } else if (dateInput && typeof dateInput === 'object' && dateInput.toDate) {
                date = dateInput.toDate();
            } else if (typeof dateInput === "string" || dateInput instanceof Date) {
                date = new Date(dateInput);
            } else if (typeof dateInput === "number") {
                date = new Date(dateInput);
            } else {
                return "Invalid Date";
            }
            
            if (isNaN(date.getTime())) return "Invalid Date";
            
            return date.toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });
        } catch (error) {
            console.error('formatDate error:', error);
            return "Invalid Date";
        }
    };

    const getEstimatedDeliveryDate = () => {
        const today = new Date();
        const estimatedDate = new Date(today);
        estimatedDate.setDate(today.getDate() + 2);
        return formatDate(estimatedDate.toISOString());
    };

    const capitalizeFirstLetter = (string) => {
        if (!string) return "Not Provided";
        if (string === "Not Provided") return "Not Provided";
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const getPaymentMethod = () => {
        return order.paymentMethod ? capitalizeFirstLetter(order.paymentMethod) : "Not Provided";
    };

    const refundItem = order.refundItems && order.refundItems.length > 0 ? order.refundItems.find(r => r.itemId === order.itemId) : null;
    const requestedAt = refundItem?.requestedAt;
    const refundedAt = refundItem?.refundedAt;

    return (
        <div className="order-details-modal-overlay">
            <div className="order-details-modal-content">
                <button className="order-details-modal-close-btn" onClick={onClose}>
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
                        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                    </span>
                </div>
                <div className="order-details-modal-body">
                    <div className="order-details-section">
                        <h5>Shipping Information</h5>
                        <p><strong>Name:</strong> {order.billingInfo?.recipientName || "Not Provided"}</p>
                        <p><strong>Phone:</strong> {order.billingInfo?.phone || "Not Provided"}</p>
                        <p><strong>Address:</strong> {order.billingInfo?.address || "Not Provided"}</p>
                        <p><strong>Email:</strong> {order.billingInfo?.email || "Not Provided"}</p>
                        <p><strong>Paid At:</strong> {formatDate(order.paidAt)}</p>
                        {order.status === "shipping" && (
                            <p><strong>Estimated Delivery:</strong> {getEstimatedDeliveryDate()}</p>
                        )}
                        {order.status === "success" && order.cancelStatus !== "cancelDirectly" && order.cancelStatus !== "cancelled" && (
                            <p><strong>Delivered At:</strong> {formatDate(order.deliveredAt)}</p>
                        )}
                        {(order.cancelStatus === "cancelDirectly" || order.cancelStatus === "cancelled") && (
                            <p><strong>Cancelled At:</strong> {formatDate(order.cancelledAt)}</p>
                        )}
                        {order.refundStatus === "Refunded" && (
                            <>
                                <p><strong>Return Requested At:</strong> {formatDate(requestedAt)}</p>
                                <p><strong>Refunded At:</strong> {formatDate(refundedAt)}</p>
                            </>
                        )}
                    </div>
                    <div className="order-details-section">
                        <h5>Product Information</h5>
                        <p><strong>Store:</strong> {order.storeName || "Not Provided"}</p>
                        {(order.items && order.items.length > 0 ? order.items : [order]).map((item, index) => (
                            <div key={`${item.itemId}-${index}`} className="product-info-container">
                                <img
                                    src={item.productImage || "https://via.placeholder.com/100"}
                                    alt={item.productName}
                                    className="product-image"
                                    onError={(e) => { e.target.src = "https://via.placeholder.com/100"; }}
                                />
                                <div className="product-details">
                                    <p><strong>Product:</strong> {item.productName || "Not Provided"}</p>
                                    <p><strong>Quantity:</strong> {item.quantity || 0}</p>
                                    <p><strong>Price:</strong> ${item.price || 0}</p>
                                    <p><strong>Total:</strong> ${item.totalPrice || 0}</p>
                                    {index === 0 && (
                                        <p><strong>Payment Method:</strong> {getPaymentMethod()}</p>
                                    )}
                                    {item.cancelStatus === "cancelDirectly" || item.cancelStatus === "cancelled" ? (
                                        <p style={{ color: "#cf1322", fontStyle: "italic" }}>
                                            <strong>Reason:</strong> {item.reason || "Not Provided"}
                                            <br />
                                            <span>This item was cancelled</span>
                                        </p>
                                    ) : item.refundStatus === "Refunded" ? (
                                        <>
                                            <p style={{ color: "#595959", fontStyle: "italic" }}>
                                                <strong>Reason:</strong> {item.reason || "Not Provided"}
                                                <br />
                                                <span>This item was refunded</span>
                                            </p>
                                            {item.evidence && item.evidence.length > 0 && (
                                                <div>
                                                    <strong>Evidence:</strong>
                                                    <div className="evidence-container">
                                                        {item.evidence.map((url, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={url}
                                                                alt={`Evidence ${idx + 1}`}
                                                                className="evidence-image"
                                                                onError={(e) => { e.target.src = "https://via.placeholder.com/100"; }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : item.status === "shipping" ? (
                                        <p style={{ color: "#0984e3", fontStyle: "italic" }}>
                                            <span>This item is being shipped</span>
                                        </p>
                                    ) : (
                                        <p style={{ color: "#389e0d", fontStyle: "italic" }}>
                                            <span>This item was delivered successfully</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
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