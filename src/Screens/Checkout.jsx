import React from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, FormGroup, Form } from "reactstrap";
import { motion } from "framer-motion";
import CommonSection from "../components/UI/CommonSection";
import "../styles/checkout.css";

const Checkout = () => {
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
                                    Total Qty: <span>0</span>
                                </h6>
                                <h6>
                                    Subtotal: <span>$120</span>
                                </h6>
                                <h6>
                                    Shipping: <span>$10</span>
                                </h6>
                                <h6>Free Shipping</h6>
                                <h4>
                                    Total Cost: <span>$130</span>
                                </h4>
                            </div>

                            <motion.button
                                whileTap={{ scale: 1.2 }}
                                className="buy__btn auth__btn w-100"
                            >
                                Place order
                            </motion.button>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Checkout;
