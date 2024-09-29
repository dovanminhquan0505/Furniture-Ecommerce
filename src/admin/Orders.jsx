import React from "react";
import { Container, Col, Row } from "reactstrap";
import useGetData from "../custom-hooks/useGetData";
import { motion } from "framer-motion";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import { doc, deleteDoc } from "firebase/firestore";
import "../styles/orders.css";

const Orders = () => {
    const { data: ordersData, loading } = useGetData("orders");

    // Handle delete orders
    const deleteOrder = async (orderId) => {
        try {
            await deleteDoc(doc(db, "orders", orderId));
            toast.success("Order deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete order:" + error.message);
        }
    }

    return (
        <section>
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
                                    <h6 className="fw-bold text-center">
                                        Loading....
                                    </h6>
                                ) : (
                                    ordersData.map((order) => {
                                        const createdAt = order.createdAt
                                            ?.toDate()
                                            .toLocaleDateString("en-US");
                                        const paidAt = order.paidAt
                                            ? order.paidAt
                                                  .toDate()
                                                  .toLocaleDateString("en-US")
                                            : "No";
                                        const deliveredAt = order.deliveredAt
                                            ? order.deliveredAt
                                                  .toDate()
                                                  .toLocaleDateString("en-US")
                                            : "No";

                                        return (
                                            <tr key={order.id}>
                                                <td data-label="OrderID">
                                                    {order.id || "No ID"}
                                                </td>
                                                <td data-label="User">
                                                    {order.billingInfo?.name}
                                                </td>
                                                <td data-label="Date">{createdAt}</td>
                                                <td data-label="Total Price">${order.totalPrice}</td>
                                                <td data-label="Paid at">{paidAt}</td>
                                                <td data-label="Delivered at">{deliveredAt}</td>
                                                <td data-label="Actions">
                                                    <motion.button
                                                        whileTap={{
                                                            scale: 1.1,
                                                        }}
                                                        className="btn btn-primary"
                                                    >
                                                        Edit
                                                    </motion.button>
                                                    <motion.button
                                                        whileTap={{
                                                            scale: 1.1,
                                                        }}
                                                        className="btn btn-danger"
                                                        onClick={() => deleteOrder(order.id)}
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
    );
};

export default Orders;
