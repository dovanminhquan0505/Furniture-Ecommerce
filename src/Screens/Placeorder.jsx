import React from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col } from "reactstrap";
import { motion } from "framer-motion";
import CommonSection from "../components/UI/CommonSection";
import { useLocation } from "react-router-dom";
import "../styles/checkout.css";
import { useSelector } from "react-redux";

const PlaceOrder = () => {
    // Get billing information from state passed via navigate
    const location = useLocation();
    const { billingInfo } = location.state || {};

    // Retrieve total price details from Redux store
    const totalQty = useSelector((state) => state.cart.totalQuantity);
    const totalAmount = useSelector((state) => state.cart.totalAmount);
    const totalShipping = useSelector((state) => state.cart.totalShipping);
    const totalTax = useSelector((state) => state.cart.totalTax);
    const totalPrice = useSelector((state) => state.cart.totalPrice);

    return (
        <Helmet title="Place Order">
            <CommonSection title="Place Order" />

            <section>
                <Container>
                    <Row>
                        {/* Billing information summary */}
                        <Col lg="8">
                            <h6 className="mb-3 fw-bold">Order Summary</h6>
                            <div className="billing__info">
                                <p><strong>Name:</strong> {billingInfo?.name || "N/A"}</p>
                                <p><strong>Email:</strong> {billingInfo?.email || "N/A"}</p>
                                <p><strong>Phone:</strong> {billingInfo?.phone || "N/A"}</p>
                                <p><strong>Address:</strong> {billingInfo?.address || "N/A"}</p>
                                <p><strong>City:</strong> {billingInfo?.city || "N/A"}</p>
                                <p><strong>Postal Code:</strong> {billingInfo?.postalCode || "N/A"}</p>
                                <p><strong>Country:</strong> {billingInfo?.country || "N/A"}</p>
                            </div>
                        </Col>

                        {/* Order details summary */}
                        <Col lg="4">
                            <div className="checkout__cart">
                                <h6>
                                    Total Qty:
                                    <span>
                                        {Math.abs(totalQty)}
                                        {Math.abs(totalQty) <= 1
                                            ? "item"
                                            : "items"}
                                    </span>
                                </h6>
                                <h6>
                                    Subtotal: <span>${totalAmount}</span>
                                </h6>
                                <h6>
                                    <span>Shipping:</span>
                                    <span>${totalShipping}</span>
                                </h6>
                                <h6>
                                    Tax: <span>${totalTax} </span>
                                </h6>
                                <h4>
                                    Total Cost: <span>${totalPrice}</span>
                                </h4>

                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 1.1 }}
                                    className="buy__btn auth__btn w-100"
                                >
                                    Confirm Order
                                </motion.button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default PlaceOrder;
