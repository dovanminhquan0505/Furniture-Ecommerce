import React, { useEffect, useState } from "react";
import { Container, Row, Col, Spinner, Badge } from "reactstrap";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
import { getRefundDisputes, resolveRefundDispute } from "../api";
import { auth } from "../firebase.config";
import { useSelector } from "react-redux";
import "../styles/refundDisputes.css";
import Modal from "../components/Modal/Modal.jsx";

const RefundDisputes = () => {
    const navigate = useNavigate();
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const reduxUser = useSelector((state) => state.user.currentUser);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            toast.error("Unauthorized! Please log in again.");
            navigate("/login");
            return;
        }

        if (!reduxUser || reduxUser.role !== "admin") {
            toast.error("You must be an admin to access this page");
            navigate("/login");
            return;
        }

        const fetchDisputes = async () => {
            try {
                setLoading(true);
                const disputesData = await getRefundDisputes();
                setDisputes(disputesData);
            } catch (error) {
                toast.error("Error fetching refund disputes: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDisputes();
    }, [navigate, reduxUser]);

    const handleResolveDispute = async (orderId, subOrderId, action) => {
        try {
            setLoading(true);
            await resolveRefundDispute(orderId, subOrderId, action);
            
            if (action === "approve") {
                setDisputes((prev) =>
                    prev.map((dispute) =>
                        dispute.subOrderId === subOrderId
                            ? {
                                  ...dispute,
                                  refundStatus: "Refunded",
                              }
                            : dispute
                    )
                );
            } else if (action === "reject") {
                setDisputes((prev) =>
                    prev.filter((dispute) => dispute.subOrderId !== subOrderId)
                );
            }
            
            toast.success(`Refund dispute ${action}d successfully!`);
        } catch (error) {
            console.error("Error in handleResolveDispute:", error);
            const errorMessage = error.message.includes("current status")
                ? "Cannot resolve dispute in its current state"
                : `Failed to ${action} dispute: ${error.message}`;
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleShowProductInfo = (dispute) => {
        setSelectedDispute(dispute);
        setShowModal(true);
    };

    if (loading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner style={{ width: "3rem", height: "3rem" }} />
                <span className="visually-hidden">Loading...</span>
            </Container>
        );
    }

    return (
        <Helmet title="Refund Disputes">
            <div className="refund-disputes-wrapper">
                <Container className="refund-disputes mt-5">
                    {disputes.length === 0 ? (
                        <p className="text-center">No refund disputes found.</p>
                    ) : (
                        <Row>
                            {disputes.map((dispute) => {
                                return (
                                    <Col
                                        lg="6"
                                        md="12"
                                        key={dispute.subOrderId}
                                        className="mb-4"
                                    >
                                        <motion.div
                                            className="dispute-card p-4"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <h3 className="mb-3 text-wrap">
                                                {dispute.orderId}
                                            </h3>
                                            <Row>
                                                <Col xs="6">
                                                    <p>
                                                        <strong>
                                                            Order ID:
                                                        </strong>{" "}
                                                        <span className="text-wrap">
                                                            {dispute.subOrderId}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        <strong>Seller:</strong>{" "}
                                                        <span className="text-wrap">
                                                            {dispute.sellerName}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Customer:
                                                        </strong>{" "}
                                                        <span className="text-wrap">
                                                            {
                                                                dispute.customerName
                                                            }
                                                        </span>
                                                    </p>
                                                </Col>
                                                <Col xs="6">
                                                    <p>
                                                        <strong>Reason:</strong>{" "}
                                                        <span className="text-wrap">
                                                            {dispute.reason}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Evidence:
                                                        </strong>{" "}
                                                        {dispute.evidence
                                                            .length > 0 ? (
                                                            <a
                                                                href={
                                                                    dispute
                                                                        .evidence[0]
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="evidence-link"
                                                            >
                                                                View
                                                            </a>
                                                        ) : (
                                                            "N/A"
                                                        )}
                                                    </p>
                                                    <p className="status-container">
                                                        <strong>Status:</strong>{" "}
                                                        {dispute.refundStatus ||
                                                            "Unknown"}
                                                    </p>
                                                </Col>
                                            </Row>
                                            <div className="btn-container">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="btn btn-info"
                                                    onClick={() =>
                                                        handleShowProductInfo(
                                                            dispute
                                                        )
                                                    }
                                                >
                                                    Product Information
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="btn btn-approve"
                                                    onClick={() =>
                                                        handleResolveDispute(
                                                            dispute.orderId,
                                                            dispute.subOrderId,
                                                            "approve"
                                                        )
                                                    }
                                                >
                                                    ✔️ Approve
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="btn btn-reject"
                                                    onClick={() =>
                                                        handleResolveDispute(
                                                            dispute.orderId,
                                                            dispute.subOrderId,
                                                            "reject"
                                                        )
                                                    }
                                                >
                                                    ❌ Reject
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
                </Container>

                {/* Modal for Product Information */}
                <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                    {selectedDispute && (
                        <div className="p-4">
                            <h5>Product Information</h5>
                            {selectedDispute.items.map((item, index) => (
                                <div key={index} className="mb-3">
                                    <img
                                        src={item.imgUrl}
                                        alt={item.productName}
                                        style={{
                                            width: "100px",
                                            height: "100px",
                                            objectFit: "cover",
                                        }}
                                    />
                                    <p>
                                        <strong>Name:</strong>{" "}
                                        {item.productName}
                                    </p>
                                    <p>
                                        <strong>Qty:</strong> {item.quantity}
                                    </p>
                                    <p>
                                        <strong>Price:</strong> $
                                        {item.price * item.quantity}
                                    </p>
                                </div>
                            ))}
                            <p>
                                <strong>Reason for Refund:</strong>{" "}
                                {selectedDispute.reason}
                            </p>
                        </div>
                    )}
                </Modal>
            </div>
        </Helmet>
    );
};

export default RefundDisputes;
