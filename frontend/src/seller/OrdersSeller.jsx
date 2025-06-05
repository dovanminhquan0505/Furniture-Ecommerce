import React, { useEffect, useState } from "react";
import { Container, Col, Row, Spinner } from "reactstrap";
import { motion } from "framer-motion";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../seller/styles/orders-seller.css";
import { useTheme } from "../components/UI/ThemeContext";
import Helmet from "../components/Helmet/Helmet";
import { confirmDelivery, deleteOrder, fetchSellerOrders, getUserById, processCancelRequest, processRefund, updateOrder } from "../api";
import Modal from "../components/Modal/Modal";

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [sellerId, setSellerId] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedSubOrder, setSelectedSubOrder] = useState(null);
    const [modalAction, setModalAction] = useState(null);
    const [selectedRefundItem, setSelectedRefundItem] = useState(null);

    useEffect(() => {
        const fetchSellerData = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("You must be logged in to view your products");
                navigate("/login");
                return;
            }

            const userData = await getUserById(currentUser.uid);
            setSellerId(userData.sellerId);
        };

        fetchSellerData();
    }, [navigate, setSellerId]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!sellerId) return;

            try {
                setLoading(true);
                const ordersData = await fetchSellerOrders(sellerId);
                setOrders(ordersData);
            } catch (error) {
                toast.error("Error fetching orders: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [sellerId]);

    // Xử lý Confirm Order
    const handleConfirmOrder = async (subOrderId, totalOrderId) => {
        try {
            await updateOrder(totalOrderId, { subOrderId, status: "processing" });
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === subOrderId
                        ? { ...order, status: "processing", statusUpdatedAt: new Date() }
                        : order
                )
            );
            toast.success("Order confirmed successfully! Processing started.");
        } catch (error) {
            toast.error("Failed to confirm order: " + error.message);
        }
    };

    // Handle confirm delivery
    const handleConfirmDelivery = async (subOrderId, totalOrderId) => {
        try {
            await confirmDelivery(totalOrderId, subOrderId);
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === subOrderId
                        ? { ...order, status: "shipping", statusUpdatedAt: new Date() }
                        : order
                )
            );
            toast.success("Delivery confirmed successfully!");
        } catch (error) {
            toast.error("Failed to confirm delivery: " + error.message);
        }
    };
    
    // Handle delete orders
    const deleteOrderHandler = async (orderId) => {
        try {
            await deleteOrder(sellerId, orderId);
            setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
            toast.success("Order deleted successfully!");
          } catch (error) {
            toast.error("Failed to delete order: " + error.message);
          }
    };

    const handleProcessCancel = async (totalOrderId, subOrderId, action, cancelId) => {
        try {
            setLoading(true);
            await processCancelRequest(totalOrderId, subOrderId, { action, cancelId });
            const updatedOrders = await fetchSellerOrders(sellerId);
            setOrders(updatedOrders);
            toast.success(`Cancellation request ${action}ed successfully!`);
            setShowProductModal(false);
            setSelectedSubOrder(null);
            setModalAction(null);
        } catch (error) {
            toast.error("Error processing cancellation request: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessRefund = async (totalOrderId, subOrderId, action, returnReceived = false, itemId, quantity, refundId) => {
        try {
            if (!refundId && (action === 'approve' || action === 'reject')) {
                console.error("Missing refundId in handleProcessRefund:", { totalOrderId, subOrderId, action, itemId, quantity, refundId });
                toast.error("Invalid refund request. Missing refund ID.");
                return;
            }

            setLoading(true);
            await processRefund(totalOrderId, subOrderId, { 
                action, 
                returnReceived, 
                itemId, 
                quantity, 
                refundId,
                statusUpdatedAt: action === 'approve' ? new Date().toISOString() : undefined,
            });
            
            const updatedOrders = await fetchSellerOrders(sellerId);
            setOrders(updatedOrders);
            toast.success(`Refund request ${action}ed successfully!`);
        } catch (error) {
            toast.error("Error processing refund request: " + error.message);
        } finally {
            setLoading(false);
            setShowProductModal(false);
            setSelectedSubOrder(null);
            setModalAction(null);
            setSelectedRefundItem(null);
        }
    };

    const handleSellerConfirmReceipt = async () => {
        if (!selectedSubOrder || !selectedSubOrder?.refundItems || !selectedRefundItem) {
            toast.error("No refund items selected");
            return;
        }
        if (!selectedRefundItem.refundId) {
            console.error("Missing refundId in handleSellerConfirmReceipt:", selectedRefundItem);
            toast.error("Invalid refund request");
            return;
        }
        try {
            setLoading(true);
            await processRefund(
                selectedSubOrder.totalOrderId,
                selectedSubOrder.id,
                {
                    action: "approve",
                    returnReceived: true,
                    itemId: selectedRefundItem.itemId,
                    quantity: selectedRefundItem.quantity,
                    refundId: selectedRefundItem.refundId,
                    statusUpdatedAt: new Date().toISOString()
                }
            );
            const updatedOrders = await fetchSellerOrders(sellerId);
            setOrders(updatedOrders);
            toast.success("Return receipt confirmed, refund processed!");
            setShowProductModal(false);
            setSelectedSubOrder(null);
            setModalAction(null);
            setSelectedRefundItem(null);
        } catch (error) {
            console.error("Error confirming receipt:", error);
            toast.error("Error confirming receipt: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const parseDate = (createdAt) => {
        if (!createdAt) return new Date();
        const date = new Date(createdAt);
        return isNaN(date.getTime()) ? new Date() : date;
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "processing":
                return "orders__status__processing";
            case "shipping":
                return "orders__status__shipping";
            case "success":
                return "orders__status__delivered";
            default:
                return "orders__status__pending";
        }
    };

    const openActionModal = (subOrder, actionType, refundItem = null, cancelId = null) => {
        if (actionType === "cancel" && !cancelId) {
            toast.error("No cancellation request selected");
            return;
        }
        if (actionType === "refund" || actionType === "confirmReceipt") {
            if (!refundItem) {
                toast.error("No refund item selected");
                return;
            }
            if (actionType === "refund" && refundItem.status !== "Requested") {
                toast.error("Invalid refund item status");
                return;
            }
            if (actionType === "confirmReceipt" && refundItem.status !== "Return Confirmed") {
                toast.error("Invalid refund item status for receipt confirmation");
                return;
            }
        }
        setSelectedSubOrder({ ...subOrder, cancelId });
        setSelectedRefundItem(refundItem);
        setModalAction(actionType);
        setShowProductModal(true);
    };

    return (
        <Helmet title=" Orders">
            <section className={`orders__section ${isDarkMode ? "dark-mode" : ""}`}>
                <Container fluid>
                    <Row className="justify-content-center">
                        <Col lg="11">
                            <div className="orders__container">
                                <h2 className="orders__title">Seller Orders</h2>
                                {loading ? (
                                    <div className="text-center">
                                        <Spinner className="spinner-border" />
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="orders__table">
                                            <thead>
                                                <tr>
                                                    <th>Order ID</th>
                                                    <th>User Name</th>
                                                    <th>Date</th>
                                                    <th>Total Amount</th>
                                                    <th>Status</th>
                                                    <th>Confirm</th>
                                                    <th>Cancel/Refund Actions</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="8" className="text-center fw-bold">
                                                            No orders found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    orders.map((order) => (
                                                        <tr
                                                            key={order.id}
                                                            onClick={() => navigate(`/placeorder/${order.totalOrderId}`)}
                                                        >
                                                            <td>{order.id}</td>
                                                            <td>{order.userName}</td>
                                                            <td>{parseDate(order.createdAt).toLocaleDateString()}</td>
                                                            <td>${order.totalAmount.toFixed(2)}</td>
                                                            <td>
                                                                <span className={`badge__seller ${getStatusClass(order.status)}`}>
                                                                    {order.status || "Pending"}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {order.status === "pending" && order.isPaid && (
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.9 }}
                                                                        className="btn__seller btn__seller-success"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleConfirmOrder(order.id, order.totalOrderId);
                                                                        }}
                                                                    >
                                                                        Confirm Order
                                                                    </motion.button>
                                                                )}
                                                                {order.status === "processing" && (
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.9 }}
                                                                        className="btn__seller btn__seller-success"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleConfirmDelivery(order.id, order.totalOrderId);
                                                                        }}
                                                                    >
                                                                        Confirm Delivery
                                                                    </motion.button>
                                                                )}
                                                                {(order.refundItems || []).map((refundItem, index) => (
                                                                    refundItem.status === "Return Confirmed" && (
                                                                        <div key={`${refundItem.refundId}-${index}`} className="mb-2">
                                                                            <motion.button
                                                                                whileTap={{ scale: 0.9 }}
                                                                                className="btn__seller btn__seller-success"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    openActionModal(order, "confirmReceipt", refundItem);
                                                                                }}
                                                                            >
                                                                                Confirm Receipt
                                                                            </motion.button>
                                                                        </div>
                                                                    )
                                                                ))}
                                                            </td>
                                                            <td>
                                                                {(order.cancelRequests || []).map((cancelRequest, index) => (
                                                                    cancelRequest.status === "Requested" && (
                                                                        <div key={index} className="mb-2">
                                                                        <small className="text-muted d-block mb-1">
                                                                            {order.items.find(i => i.id === cancelRequest.itemId)?.productName || 'Unknown Item'} (Qty: {cancelRequest.quantity})
                                                                        </small>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            className="btn__seller btn__seller-success me-2"
                                                                            onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openActionModal(order, "cancel", null, cancelRequest.cancelId);
                                                                            }}
                                                                        >
                                                                            Approve Cancel
                                                                        </motion.button>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            className="btn__seller btn__seller-danger"
                                                                            onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleProcessCancel(order.totalOrderId, order.id, "reject", cancelRequest.cancelId);
                                                                            }}
                                                                        >
                                                                            Reject Cancel
                                                                        </motion.button>
                                                                        </div>
                                                                    )
                                                                    ))}
                                                                {(order.refundItems || []).map((refundItem, index) => {
                                                                    const item = order.items.find(i => i.id === refundItem.itemId);
                                                                    const itemName = item ? item.productName : 'Unknown Item';
                                                                    
                                                                    return (
                                                                        <div key={`${refundItem.refundId}-${index}`} className="mb-2">
                                                                            {refundItem.status === "Requested" && (
                                                                                <div className="refund-item-actions border-top">
                                                                                    <small className="text-muted d-block mb-1 mt-1">
                                                                                        {itemName} (Qty: {refundItem.quantity})
                                                                                    </small>
                                                                                    <motion.button
                                                                                        whileTap={{ scale: 0.9 }}
                                                                                        className="btn__seller btn__seller-success me-2"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            openActionModal(order, "refund", refundItem);
                                                                                        }}
                                                                                    >
                                                                                        Approve Refund
                                                                                    </motion.button>
                                                                                    <motion.button
                                                                                        whileTap={{ scale: 0.9 }}
                                                                                        className="btn__seller btn__seller-danger"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (!refundItem.refundId) {
                                                                                                toast.error("Invalid refund item");
                                                                                                return;
                                                                                            }
                                                                                            handleProcessRefund(
                                                                                                order.totalOrderId,
                                                                                                order.id,
                                                                                                "reject",
                                                                                                false,
                                                                                                refundItem.itemId,
                                                                                                refundItem.quantity,
                                                                                                refundItem.refundId
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        Reject Refund
                                                                                    </motion.button>
                                                                                </div>
                                                                            )}
                                                                            {refundItem.status === "Return Requested" && (
                                                                                <div className="refund-item-status">
                                                                                    <small className="text-info d-block">
                                                                                        {itemName} (Qty: {refundItem.quantity}) - Awaiting customer return
                                                                                    </small>
                                                                                </div>
                                                                            )}
                                                                            {refundItem.status === "Return Confirmed" && (
                                                                                <div className="refund-item-actions">
                                                                                    <small className="text-warning d-block mb-1">
                                                                                        {itemName} (Qty: {refundItem.quantity}) - Return confirmed by customer
                                                                                    </small>
                                                                                </div>
                                                                            )}
                                                                            {refundItem.status === "Refunded" && (
                                                                                <div className="refund-item-status">
                                                                                    <small className="text-success d-block">
                                                                                        {itemName} (Qty: {refundItem.quantity}) - Refunded
                                                                                    </small>
                                                                                </div>
                                                                            )}
                                                                            {refundItem.status === "Rejected" && (
                                                                                <div className="refund-item-status">
                                                                                    <small className="text-danger d-block">
                                                                                        {itemName} (Qty: {refundItem.quantity}) - Refund Rejected
                                                                                    </small>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                                {(order.cancelStatus === "Approved" || (order.refundItems || []).some(r => r.status === "Refunded")) && (
                                                                    <div className="mt-2 pt-2 border-top">
                                                                        {order.cancelStatus === "Approved" && (
                                                                            <small className="text-info d-block">
                                                                                Cancelled: {order.cancelQuantity} item(s)
                                                                            </small>
                                                                        )}
                                                                        {(order.refundItems || []).filter(r => r.status === "Refunded").length > 0 && (
                                                                            <small className="text-success d-block">
                                                                                Total Refunded: {order.refundItems.filter(r => r.status === "Refunded").reduce((sum, r) => sum + r.quantity, 0)} item(s)
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <motion.button
                                                                    whileTap={{ scale: 0.9 }}
                                                                    className="btn__seller btn__seller-delete"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteOrderHandler(order.id);
                                                                    }}
                                                                >
                                                                    Delete
                                                                </motion.button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
            <Modal
                isOpen={showProductModal}
                onClose={() => {
                    setShowProductModal(false);
                    setSelectedSubOrder(null);
                    setModalAction(null);
                    setSelectedRefundItem(null);
                }}
            >
                {selectedSubOrder && (
                    <div className="p-3">
                        <h5>
                            {modalAction === "cancel"
                                ? "Cancel Request Details"
                                : modalAction === "refund"
                                ? "Refund Request Details"
                                : "Confirm Return Receipt"}
                        </h5>
                        {(modalAction === "cancel" || modalAction === "refund" || modalAction === "confirmReceipt") && selectedRefundItem && (
                            (() => {
                                const item = selectedSubOrder.items.find(i => i.id === selectedRefundItem.itemId);
                                if (!item) return <p>Item not found</p>;
                                return (
                                    <div className="cart__item">
                                        <img
                                            src={item.imgUrl}
                                            alt={item.productName}
                                            className="cart__item-img"
                                        />
                                        <div className="cart__item-info">
                                            <h6>{item.productName}</h6>
                                            <p>Requested Qty: {selectedRefundItem.quantity}</p>
                                            <p>Price per unit: ${item.price}</p>
                                            <p>Total: ${(item.price * selectedRefundItem.quantity).toFixed(2)}</p>
                                            {modalAction !== "cancel" && (
                                                <>
                                                    <h6 className="mb-1">Refund Reason:</h6>
                                                    <p>{selectedRefundItem.reason || "No reason provided"}</p>
                                                    <h6 className="mb-2 mt-1">Evidence:</h6>
                                                    {selectedRefundItem.evidence?.length > 0 ? (
                                                        selectedRefundItem.evidence.map((url, index) => (
                                                            <div key={index}>
                                                                <img src={url} alt={`Evidence ${index + 1}`} className="evidence-img" />
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p>No evidence provided</p>
                                                    )}
                                                </>
                                            )}
                                            {modalAction === "cancel" && (
                                                <>
                                                    <h6 className="mb-1">Cancel Reason:</h6>
                                                    <p>{selectedRefundItem.reason || "No reason provided"}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                        {modalAction === "cancel" && !selectedRefundItem && (
                            (selectedSubOrder.cancelRequests || [])
                                .filter((c) => c.cancelId === selectedSubOrder.cancelId)
                                .map((cancelRequest, index) => {
                                    const item = selectedSubOrder.items.find((i) => i.id === cancelRequest.itemId);
                                    if (!item) return null;
                                    return (
                                        <div key={index} className="cart__item">
                                            <img
                                                src={item.imgUrl}
                                                alt={item.productName}
                                                className="cart__item-img"
                                            />
                                            <div className="cart__item-info">
                                                <h6>{item.productName}</h6>
                                                <p>Requested Qty: {cancelRequest.quantity}</p>
                                                <p>Price per unit: ${item.price}</p>
                                                <p>Total: ${(item.price * cancelRequest.quantity).toFixed(2)}</p>
                                                <h6 className="mb-1">Cancel Reason:</h6>
                                                <p>{cancelRequest.reason || "No reason provided"}</p>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                        <div className="mt-3">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="btn__seller btn__seller-danger me-2"
                                onClick={() => {
                                    setShowProductModal(false);
                                    setSelectedSubOrder(null);
                                    setModalAction(null);
                                    setSelectedRefundItem(null);
                                }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="btn__seller btn__seller-success"
                                onClick={() => {
                                    if (modalAction === "cancel") {
                                        handleProcessCancel(
                                            selectedSubOrder.totalOrderId,
                                            selectedSubOrder.id,
                                            "approve",
                                            selectedSubOrder.cancelId
                                        );
                                    } else if (modalAction === "refund") {
                                        if (!selectedRefundItem?.refundId) {
                                            console.error("Missing refundId in selectedRefundItem:", selectedRefundItem);
                                            toast.error("Invalid refund request. Missing refund ID.");
                                            return;
                                        }
                                        handleProcessRefund(
                                            selectedSubOrder.totalOrderId,
                                            selectedSubOrder.id,
                                            "approve",
                                            false,
                                            selectedRefundItem.itemId,
                                            selectedRefundItem.quantity,
                                            selectedRefundItem.refundId
                                        );
                                    } else if (modalAction === "confirmReceipt") {
                                        handleSellerConfirmReceipt();
                                    }
                                }}
                            >
                                Confirm
                            </motion.button>
                        </div>
                    </div>
                )}
            </Modal>
        </Helmet>
    );
};

export default Orders;
