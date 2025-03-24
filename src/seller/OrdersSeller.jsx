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

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [sellerId, setSellerId] = useState(null);

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
            await processCancelRequest(totalOrderId, subOrderId, action);
            setOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order.id === subOrderId
                        ? { ...order, cancelStatus: action === "approve" ? "Approved" : "Rejected" }
                        : order
                )
            );
            toast.success(`Cancellation request ${action}d successfully!`);
        } catch (error) {
            toast.error(`Failed to ${action} cancellation request: ` + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessRefund = async (totalOrderId, subOrderId, action) => {
        try {
            setLoading(true);
            await processRefund(totalOrderId, subOrderId, action);
            setOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order.id === subOrderId
                        ? { ...order, refundStatus: action === "approve" ? "Refunded" : "Rejected" }
                        : order
                )
            );
            toast.success(`Refund request ${action}d successfully!`);
        } catch (error) {
            toast.error(`Failed to ${action} refund request: ` + error.message);
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

    return (
        <Helmet title=" Orders">
            <section
                className={`orders__section ${isDarkMode ? "dark-mode" : ""}`}
            >
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
                                                            </td>
                                                            <td>
                                                                {order.cancelStatus === "Requested" && (
                                                                    <div>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            className="btn__seller btn__seller-success"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleProcessCancel(order.totalOrderId, order.id, "approve");
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
                                                                                handleProcessRefund(order.totalOrderId, order.id, "approve");
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
        </Helmet>
    );
};

export default Orders;
