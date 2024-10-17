import React from "react";
import { Container, Row, Col, Spinner } from "reactstrap";
import useGetData from "../custom-hooks/useGetData";
import { motion } from "framer-motion";
import "../styles/all-products.css";
import { useTheme } from "../components/UI/ThemeContext";
import Helmet from "../components/Helmet/Helmet";
import { useNavigate } from "react-router-dom";

const Orders = () => {
    const { data: ordersData, loading } = useGetData("totalOrders");
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    const viewOrders = (orderId) => {
        navigate(`/placeorder/${orderId}`)
    }
    return (
        <Helmet title=" Users">
            <section className={`${isDarkMode ? "dark-mode" : "light-mode"}`}>
                <Container>
                    <Row>
                        <Col lg="12" className="pt-1">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Username</th>
                                        <th>Date</th>
                                        <th>Total Amount</th>
                                        <th>Paid At</th>
                                        <th>Delivered At</th>
                                        <th>Action</th>
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
                                        ordersData?.map((order) => (
                                            <tr key={order.id}>
                                                <td data-label="Order ID">
                                                    {order.id}
                                                </td>
                                                <td data-label="Username">
                                                    {order.billingInfo?.name}
                                                </td>
                                                <td data-label="Date">
                                                    {order.createdAt
                                                        .toDate()
                                                        .toLocaleDateString()}
                                                </td>
                                                <td data-label="Total Amount">
                                                    ${order.totalPrice}
                                                </td>
                                                <td data-label="Paid At">
                                                    {order.paidAt
                                                        .toDate()
                                                        .toLocaleDateString() ||
                                                        "No"}
                                                </td>
                                                <td data-label="Delivered At">
                                                    {order.isDelivered
                                                        ? "Yes"
                                                        : "No"}
                                                </td>
                                                <td data-label="Action">
                                                    <motion.button
                                                        onClick={() => {
                                                            viewOrders(
                                                                order.id
                                                            );
                                                        }}
                                                        whileTap={{
                                                            scale: 1.1,
                                                        }}
                                                        className="btn btn-primary"
                                                    >
                                                        View
                                                    </motion.button>
                                                </td>
                                            </tr>
                                        ))
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
