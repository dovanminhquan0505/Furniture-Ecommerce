import React, { useEffect, useState } from "react";
import { Container, Col, Row, Spinner } from "reactstrap";
import { motion } from "framer-motion";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../seller/styles/orders-seller.css";
import { useTheme } from "../components/UI/ThemeContext";
import Helmet from "../components/Helmet/Helmet";
import { deleteOrder, fetchSellerOrders, getUserById, processCancelRequest, processRefund, updateOrder } from "../api";
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

    const handleProcessCancel = async (totalOrderId, subOrderId, action) => {
        try {
            setLoading(true);
            await processCancelRequest(totalOrderId, subOrderId, { action });
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

    const handleProcessRefund = async (totalOrderId, subOrderId, action, returnReceived = false) => {
        try {
            setLoading(true);
            await processRefund(totalOrderId, subOrderId, { action, returnReceived });
            const updatedOrders = await fetchSellerOrders(sellerId);
            setOrders(updatedOrders);
            toast.success(`Refund request ${action}ed successfully!`);
            setShowProductModal(false);
            setSelectedSubOrder(null);
            setModalAction(null);
        } catch (error) {
            toast.error("Error processing refund request: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSellerConfirmReceipt = async () => {
        if (selectedSubOrder.refundStatus !== "Return Confirmed") {
            toast.error("Cannot confirm receipt: Invalid refund status");
            return;
        }
        try {
            setLoading(true);
            await processRefund(selectedSubOrder.totalOrderId, selectedSubOrder.id, {
                action: "approve",
                returnReceived: true,
                itemId: selectedSubOrder.refundItemId,
                quantity: selectedSubOrder.refundQuantity,
            });
            const updatedOrders = await fetchSellerOrders(sellerId);
            setOrders(updatedOrders);
            toast.success("Return receipt confirmed, refund processed!");
            setShowProductModal(false);
            setSelectedSubOrder(null);
            setModalAction(null);
        } catch (error) {
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

    const openActionModal = (subOrder, actionType) => {
        setSelectedSubOrder(subOrder);
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
                                                                {order.refundStatus === "Return Confirmed" && (
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.9 }}
                                                                        className="btn__seller btn__seller-success"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSellerConfirmReceipt(order);
                                                                        }}
                                                                    >
                                                                        Confirm Receipt
                                                                    </motion.button>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {order.cancelStatus === "Requested" && (
                                                                    <div>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            className="btn__seller btn__seller-success"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openActionModal(order, "cancel");
                                                                            }}
                                                                        >
                                                                            Approve Cancel
                                                                        </motion.button>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            className="btn__seller btn__seller-danger"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleProcessCancel(order.totalOrderId, order.id, "reject");
                                                                            }}
                                                                        >
                                                                            Reject Cancel
                                                                        </motion.button>
                                                                    </div>
                                                                )}
                                                                {order.refundStatus === "Requested" && (
                                                                    <div>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            className="btn__seller btn__seller-success"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openActionModal(order, "refund");
                                                                            }}
                                                                        >
                                                                            Approve Refund
                                                                        </motion.button>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            className="btn__seller btn__seller-danger"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleProcessRefund(order.totalOrderId, order.id, "reject");
                                                                            }}
                                                                        >
                                                                            Reject Refund
                                                                        </motion.button>
                                                                    </div>
                                                                )}
                                                                {(order.cancelStatus === "Approved" || order.refundStatus === "Refunded") && (
                                                                    <p>
                                                                        {order.cancelStatus === "Approved" && (
                                                                            <>
                                                                                Cancelled: {order.cancelQuantity} item(s)
                                                                            </>
                                                                        )}
                                                                        {order.refundStatus === "Refunded" && (
                                                                            <>
                                                                                Refunded: {order.refundQuantity} item(s)
                                                                            </>
                                                                        )}
                                                                    </p>
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
                        {selectedSubOrder.items
                            .filter((item) => item.id === (selectedSubOrder.cancelItemId || selectedSubOrder.refundItemId))
                            .map((item, index) => (
                                <div key={index} className="cart__item">
                                    <img
                                        src={item.imgUrl}
                                        alt={item.productName}
                                        className="cart__item-img"
                                    />
                                    <div className="cart__item-info">
                                        <h6>{item.productName}</h6>
                                        <p>Requested Qty: {selectedSubOrder.cancelQuantity || selectedSubOrder.refundQuantity}</p>
                                        <p>Price per unit: ${item.price}</p>
                                        <p>Total: ${(item.price * (selectedSubOrder.cancelQuantity || selectedSubOrder.refundQuantity)).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        <h6 className="mb-1">
                            {modalAction === "cancel" ? "Cancel Reason" : "Refund Reason"}:
                        </h6>
                        <p>
                            {(modalAction === "cancel"
                                ? selectedSubOrder.cancelReason
                                : selectedSubOrder.refundRequest?.reason) || "No reason provided"}
                        </p>
                        {modalAction === "refund" && (
                            <>
                                <h6 className="mb-2 mt-1">Evidence:</h6>
                                {selectedSubOrder.refundRequest?.evidence?.length > 0 ? (
                                    selectedSubOrder.refundRequest.evidence.map((url, index) => (
                                        <div key={index}>
                                            <img src={url} alt={`Evidence ${index + 1}`} className="evidence-img" />
                                        </div>
                                    ))
                                ) : (
                                    <p>No evidence provided</p>
                                )}
                            </>
                        )}
                        <div className="mt-3">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="btn__seller btn__seller-danger me-2"
                                onClick={() => {
                                    setShowProductModal(false);
                                    setSelectedSubOrder(null);
                                    setModalAction(null);
                                }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="btn__seller btn__seller-success"
                                onClick={() => {
                                    console.log("Modal Action:", modalAction); // Debug log
        console.log("Selected SubOrder:", selectedSubOrder);
                                    if (modalAction === "cancel") {
                                        handleProcessCancel(
                                            selectedSubOrder.totalOrderId,
                                            selectedSubOrder.id,
                                            "approve"
                                        );
                                    } else if (modalAction === "refund") {
                                        handleProcessRefund(
                                            selectedSubOrder.totalOrderId,
                                            selectedSubOrder.id,
                                            "approve"
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
