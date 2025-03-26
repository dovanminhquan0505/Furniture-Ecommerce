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

const RefundDisputes = () => {
    const navigate = useNavigate();
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
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
            setDisputes((prev) =>
                prev.map((dispute) =>
                    dispute.subOrderId === subOrderId
                        ? { ...dispute, refundStatus: action === "approve" ? "Refunded" : "Rejected" }
                        : dispute
                )
            );
            toast.success(`Refund dispute ${action}d successfully!`);
        } catch (error) {
            toast.error(`Failed to ${action} dispute: ` + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <Spinner style={{ width: "3rem", height: "3rem" }} />
                <span className="visually-hidden">Loading...</span>
            </Container>
        );
    }

    return (
        <Helmet title="Refund Disputes">
            <section className="refund-disputes-section">
                <Container>
                    <Row>
                        <Col lg="12">
                            <div className="section-header">
                                <h2 className="section-title">Refund Disputes</h2>
                                <span className="disputes-count">
                                    {disputes.length} {disputes.length === 1 ? "Dispute" : "Disputes"}
                                </span>
                            </div>
                            {disputes.length === 0 ? (
                                <div className="no-disputes">
                                    <p>No refund disputes found</p>
                                </div>
                            ) : (
                                <div className="disputes-table-wrapper">
                                    <table className="disputes-table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Sub-Order ID</th>
                                                <th>Seller</th>
                                                <th>Customer</th>
                                                <th>Reason</th>
                                                <th>Evidence</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {disputes.map((dispute) => (
                                                <tr key={dispute.subOrderId}>
                                                    <td>{dispute.orderId}</td>
                                                    <td>{dispute.subOrderId}</td>
                                                    <td>{dispute.sellerName}</td>
                                                    <td>{dispute.customerName}</td>
                                                    <td>{dispute.reason}</td>
                                                    <td>
                                                        {dispute.evidence.length > 0 ? (
                                                            <a
                                                                href={dispute.evidence[0]}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="evidence-link"
                                                            >
                                                                View
                                                            </a>
                                                        ) : (
                                                            "N/A"
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            className={`status-badge ${
                                                                dispute.refundStatus === "Requested"
                                                                    ? "badge-warning"
                                                                    : dispute.refundStatus === "Refunded"
                                                                    ? "badge-success"
                                                                    : "badge-danger"
                                                            }`}
                                                        >
                                                            {dispute.refundStatus}
                                                        </Badge>
                                                    </td>
                                                    <td className="actions-cell">
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            className="action-btn approve-btn"
                                                            onClick={() =>
                                                                handleResolveDispute(
                                                                    dispute.orderId,
                                                                    dispute.subOrderId,
                                                                    "approve"
                                                                )
                                                            }
                                                        >
                                                            Approve
                                                        </motion.button>
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            className="action-btn reject-btn"
                                                            onClick={() =>
                                                                handleResolveDispute(
                                                                    dispute.orderId,
                                                                    dispute.subOrderId,
                                                                    "reject"
                                                                )
                                                            }
                                                        >
                                                            Reject
                                                        </motion.button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default RefundDisputes;