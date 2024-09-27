import React, { useState } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, FormGroup, Form } from "reactstrap";
import { motion } from "framer-motion";
import CommonSection from "../components/UI/CommonSection";
import "../styles/checkout.css";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../custom-hooks/useAuth";

const Checkout = () => {
    const { currentUser } = useAuth();
    const totalQty = useSelector((state) => state.cart.totalQuantity);
    const totalAmount = useSelector((state) => state.cart.totalAmount);
    const totalShipping = useSelector((state) => state.cart.totalShipping);
    const totalTax = useSelector((state) => state.cart.totalTax);
    const totalPrice = useSelector((state) => state.cart.totalPrice);
    const navigate = useNavigate();
    // Create state of billing information
    const [billingInfo, setBillingInfo] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
    });

    // Update state when user enters information
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBillingInfo((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle when user clicks on place order button
    const handlePlaceOrder = (e) => {
        e.preventDefault();

        if (!currentUser) {
            // Redirect to login if user is not logged in
            navigate("/login");
        } else {
            // Navigate to placeorder page and pass the billingInfo as state
            navigate("/placeorder", { state: { billingInfo } });
        }
    };

    return (
        <Helmet title=" Checkout">
            <CommonSection title="Checkout" />

            <section>
                <Container>
                    <Row>
                        <Col lg="8">
                            <h6 className="mb-4 fw-bold">
                                Billing Information
                            </h6>
                            <Form className="billing__form">
                                <FormGroup className="form__group">
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter your name"
                                        value={billingInfo.name}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="example@gmail.com"
                                        value={billingInfo.email}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input
                                        type="number"
                                        name="phone"
                                        placeholder="Phone number"
                                        value={billingInfo.phone}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="Street address"
                                        value={billingInfo.address}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        value={billingInfo.city}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input
                                        type="text"
                                        name="postalCode"
                                        placeholder="Postal code"
                                        value={billingInfo.postalCode}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input
                                        type="text"
                                        name="country"
                                        placeholder="Country"
                                        value={billingInfo.country}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>
                            </Form>
                        </Col>

                        <Col lg="4">
                            <div className="checkout__cart">
                                <h6>
                                    Total Qty:{" "}
                                    <span>
                                        {Math.abs(totalQty)}{" "}
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
                                    onClick={handlePlaceOrder}
                                >
                                    Place order
                                </motion.button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Checkout;
