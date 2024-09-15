import React from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, FormGroup, Form } from "reactstrap";
import { motion } from "framer-motion";
import CommonSection from "../components/UI/CommonSection";
import "../styles/checkout.css";
import { useSelector } from "react-redux";

const Checkout = () => {
    const totalQty = useSelector(state => state.cart.totalQuantity);
    const totalAmount = useSelector(state => state.cart.totalAmount);
    const totalShipping = useSelector(state => state.cart.totalShipping);
    const totalTax = useSelector(state => state.cart.totalTax);
    const totalPrice = useSelector(state => state.cart.totalPrice);
    
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
                                        placeholder="Enter your name"
                                    />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input
                                        type="email"
                                        placeholder="example@gmail.com"
                                    />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input
                                        type="number"
                                        placeholder="Phone number"
                                    />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input
                                        type="text"
                                        placeholder="Street address"
                                    />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input type="text" placeholder="City" />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input
                                        type="text"
                                        placeholder="Postal code"
                                    />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input type="text" placeholder="Country" />
                                </FormGroup>
                            </Form>
                        </Col>

                        <Col lg="4">
                            <div className="checkout__cart">
                                <h6>
                                    Total Qty: <span>{Math.abs(totalQty)} {Math.abs(totalQty) <= 1 ? 'item' : 'items'}</span>
                                </h6>
                                <h6>
                                    Subtotal: <span>${totalAmount}</span>
                                </h6>
                                <h6>
                                    <span>
                                        Shipping:
                                    </span>
                                    <span>${totalShipping}</span>
                                </h6>
                                <h6>
                                    Tax: <span>${totalTax} </span>
                                </h6>
                                <h4>
                                    Total Cost: <span>${totalPrice}</span>
                                </h4>

                                <motion.button
                                    whileTap={{ scale: 1.2 }}
                                    className="buy__btn auth__btn w-100"
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
