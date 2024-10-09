import React from "react";
import { Container, Col, Row, Spinner } from "reactstrap";
import useGetData from "../custom-hooks/useGetData";
import { motion } from "framer-motion";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import { doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/orders.css";
import { useTheme } from "../components/UI/ThemeContext";
import Helmet from "../components/Helmet/Helmet";

const Orders = () => {
    const { data: ordersData, loading } = useGetData("orders");
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    // Handle delete orders
    const deleteOrder = async (orderId) => {
        try {
            await deleteDoc(doc(db, "orders", orderId));
            toast.success("Order deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete order:" + error.message);
        }
    };

    // Handle edit orders
    const editOrder = (orderId) => {
        navigate(`/placeorder/${orderId}`);
    };

    return (
        <Helmet title=" Orders">
            <section className={`${isDarkMode ? "dark-mode" : "light-mode"}`}>
                <Container>
                    <Row>
                        <Col lg="12">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>OrderID</th>
                                        <th>User</th>
                                        <th>Date</th>
                                        <th>Total Price</th>
                                        <th>Paid at</th>
                                        <th>Delivered at</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <Container
                                            className="d-flex justify-content-center align-items-center"
                                            style={{ height: "100vh" }}
                                        >
                                            <Spinner
                                                style={{
                                                    width: "3rem",
                                                    height: "3rem",
                                                }}
                                            />
                                            <span className="visually-hidden">
                                                Loading...
                                            </span>
                                        </Container>
                                    ) : (
                                        ordersData.map((order) => {
                                            const createdAt = order.createdAt
                                                ?.toDate()
                                                .toLocaleDateString("en-US");
                                            const paidAt = order.paidAt
                                                ? order.paidAt
                                                      .toDate()
                                                      .toLocaleString("en-US")
                                                : "No";
                                            const deliveredAt =
                                                order.deliveredAt
                                                    ? order.deliveredAt
                                                          .toDate()
                                                          .toLocaleString(
                                                              "en-US"
                                                          )
                                                    : "No";

                                            return (
                                                <tr key={order.id}>
                                                    <td data-label="OrderID">
                                                        {order.id || "No ID"}
                                                    </td>
                                                    <td data-label="User">
                                                        {
                                                            order.billingInfo
                                                                ?.name
                                                        }
                                                    </td>
                                                    <td data-label="Date">
                                                        {createdAt}
                                                    </td>
                                                    <td data-label="Total Price">
                                                        ${order.totalPrice}
                                                    </td>
                                                    <td data-label="Paid at">
                                                        {paidAt}
                                                    </td>
                                                    <td data-label="Delivered at">
                                                        {deliveredAt}
                                                    </td>
                                                    <td
                                                        data-label="Actions"
                                                        className="actions__orders"
                                                    >
                                                        <motion.button
                                                            whileTap={{
                                                                scale: 1.1,
                                                            }}
                                                            className="btn btn-primary"
                                                            onClick={() =>
                                                                editOrder(
                                                                    order.id
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </motion.button>
                                                        <motion.button
                                                            whileTap={{
                                                                scale: 1.1,
                                                            }}
                                                            className="btn btn-danger"
                                                            onClick={() =>
                                                                deleteOrder(
                                                                    order.id
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </motion.button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Orders;
