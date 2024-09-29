import React from "react";
import { Container, Col, Row } from "reactstrap";
import useGetData from "../custom-hooks/useGetData";
import { motion } from "framer-motion";

const Orders = () => {
    const { data: ordersData, loading } = useGetData("orders");

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
                                    ordersData.map((order, index) => {
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
                                            <tr key={index}>
                                                <td>
                                                    {order.paymentResult
                                                        ? order.paymentResult.id
                                                        : "No ID"}
                                                </td>
                                                <td>
                                                    {order.billingInfo?.name}
                                                </td>
                                                <td>{createdAt}</td>
                                                <td>${order.totalPrice}</td>
                                                <td>{paidAt}</td>
                                                <td>{deliveredAt}</td>
                                                <td>
                                                    <motion.button
                                                        whileTap={{
                                                            scale: 1.1,
                                                        }}
                                                        className="btn"
                                                    >
                                                        Edit
                                                    </motion.button>
                                                    <motion.button
                                                        whileTap={{
                                                            scale: 1.1,
                                                        }}
                                                        className="btn btn-danger"
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
