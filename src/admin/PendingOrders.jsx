import React, { useEffect, useState } from "react";
import "../styles/pendingorders.css";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import { Button, Col, Container, Row, Spinner } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import { approvePendingOrder, getPendingOrders, rejectPendingOrder } from "../api";

const PendingOrders = () => {
    const [pendingOrdersData, setPendingOrdersData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPendingOrders = async () => {
            const user = auth.currentUser;
            if (!user) {
                toast.error("Unauthorized! Please log in again.");
                return;
            }

            try {
                const orders = await getPendingOrders();
                setPendingOrdersData(orders);
            } catch (error) {
                toast.error("Failed to fetch pending orders: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPendingOrders();
    }, []);

    const handleApprove = async (order) => {
        const user = auth.currentUser;
        if (!user) {
            toast.error("No authenticated user found!");
            return;
        }

        try {
            await approvePendingOrder(order.id);
            setPendingOrdersData((prev) => prev.filter((o) => o.id !== order.id));
            toast.success("Seller account approved and created successfully!");
        } catch (error) {
            toast.error("Error approving seller account: " + error.message);
        }
    };

    const handleReject = async (orderId) => {
        const user = auth.currentUser;
        if (!user) {
            toast.error("No authenticated user found!");
            return;
        }

        try {
            await rejectPendingOrder(orderId);
            setPendingOrdersData((prev) => prev.filter((o) => o.id !== orderId));
            toast.success("Order rejected successfully!");
        } catch (error) {
            toast.error("Error rejecting order: " + error.message);
        }
    };

    return (
        <Helmet title=" Pending Orders">
            <Container className="pending-orders mt-5">
                <h2 className="text-center mb-4">Pending Orders</h2>
                {loading ? (
                    <Container
                        className="d-flex justify-content-center align-items-center"
                        style={{ height: "100vh" }}
                    >
                        <Spinner style={{ width: "3rem", height: "3rem" }} />
                        <span className="visually-hidden">Loading...</span>
                    </Container>
                ) : (
                    <>
                        {pendingOrdersData.length === 0 ? (
                            <p className="text-center">
                                No pending orders available.
                            </p>
                        ) : (
                            <Row>
                                {pendingOrdersData.map((order) => (
                                    <Col
                                        lg="6"
                                        md="12"
                                        key={order.id}
                                        className="mb-4"
                                    >
                                        <div className="order-card p-4">
                                            <h3 className="mb-3">
                                                {order.storeName}
                                            </h3>
                                            <Row>
                                                <Col xs="6">
                                                    <p>
                                                        <strong>
                                                            Full Name:
                                                        </strong>{" "}
                                                        {order.fullName}
                                                    </p>
                                                    <p>
                                                        <strong>Email:</strong>{" "}
                                                        {order.email}
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Store Email:
                                                        </strong>{" "}
                                                        {order.storeEmail}
                                                    </p>
                                                </Col>
                                                <Col xs="6">
                                                    <p>
                                                        <strong>Phone:</strong>{" "}
                                                        {order.phoneNumber}
                                                    </p>
                                                    <p>
                                                        <strong>City:</strong>{" "}
                                                        {order.city}
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Business Type:
                                                        </strong>{" "}
                                                        {order.businessType}
                                                    </p>
                                                </Col>
                                            </Row>
                                            <p>
                                                <strong>Address:</strong>{" "}
                                                {order.address}
                                            </p>
                                            <p>
                                                <strong>
                                                    Store Description:
                                                </strong>{" "}
                                                {order.storeDescription}
                                            </p>
                                            <p>
                                                <strong>Created At:</strong>{" "}
                                                {new Date(order.createdAt).toLocaleDateString("en-US")}
                                            </p>
                                            <div className="d-flex justify-content-between mt-3">
                                                <Button
                                                    color="success"
                                                    onClick={() =>
                                                        handleApprove(order)
                                                    }
                                                >
                                                    ✔️ Approve
                                                </Button>
                                                <Button
                                                    color="danger"
                                                    onClick={() =>
                                                        handleReject(order.id)
                                                    }
                                                >
                                                    ❌ Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </>
                )}
            </Container>
        </Helmet>
    );
};

export default PendingOrders;
