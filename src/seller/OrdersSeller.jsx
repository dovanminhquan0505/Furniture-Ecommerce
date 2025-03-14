import React, { useEffect, useState } from "react";
import { Container, Col, Row, Spinner } from "reactstrap";
import { motion } from "framer-motion";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../seller/styles/orders-seller.css";
import { useTheme } from "../components/UI/ThemeContext";
import Helmet from "../components/Helmet/Helmet";
import { confirmDelivery, deleteOrder, fetchSellerOrders, getUserById } from "../api";

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

    // Handle Deliver orders for each seller
    const handleConfirmDelivery = async (orderId) => {
        try {
            await confirmDelivery(orderId); 
            setOrders((prevOrders) =>
              prevOrders.map((order) =>
                order.id === orderId ? { ...order, isDelivered: true, deliveredAt: new Date() } : order
              )
            );
            toast.success("Order delivered successfully!");
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

    const parseDate = (createdAt) => {
        if (!createdAt) return new Date();
        const date = new Date(createdAt);
        return isNaN(date.getTime()) ? new Date() : date;
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Delivered":
                return "orders__status__delivered";
            case "Paid":
                return "orders__status__paid";
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
                        <Col lg="10">
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
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan="8"
                                                            className="text-center fw-bold"
                                                        >
                                                            No orders found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    orders.map((order) => (
                                                        <tr
                                                            key={order.id}
                                                            onClick={() =>
                                                                navigate(
                                                                    `/placeorder/${order.totalOrderId}`
                                                                )
                                                            }
                                                        >
                                                            <td>{order.id}</td>
                                                            <td>
                                                                {order.userName}
                                                            </td>
                                                            <td>
                                                                {parseDate(order.createdAt).toLocaleDateString()}
                                                            </td>
                                                            <td>
                                                                $
                                                                {order.totalAmount.toFixed(
                                                                    2
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className={`badge__seller ${getStatusClass(
                                                                        order.isPaid
                                                                            ? "Paid"
                                                                            : "Pending"
                                                                    )}`}
                                                                >
                                                                    {order.isPaid
                                                                        ? "Paid"
                                                                        : "Pending"}
                                                                </span>
                                                                {order.isDelivered && (
                                                                    <span
                                                                        className={`badge__seller ${getStatusClass(
                                                                            "Delivered"
                                                                        )}`}
                                                                        style={{
                                                                            marginLeft:
                                                                                "5px",
                                                                        }}
                                                                    >
                                                                        Delivered
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {!order.isDelivered && (
                                                                    <motion.button
                                                                        whileTap={{
                                                                            scale: 0.9,
                                                                        }}
                                                                        className="btn__seller btn__seller-success"
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            handleConfirmDelivery(
                                                                                order.id
                                                                            );
                                                                        }}
                                                                    >
                                                                        Confirm
                                                                        Delivered
                                                                    </motion.button>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <motion.button
                                                                    whileTap={{
                                                                        scale: 0.9,
                                                                    }}
                                                                    className="btn__seller btn__seller-delete"
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        deleteOrderHandler(
                                                                            order.id
                                                                        );
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
