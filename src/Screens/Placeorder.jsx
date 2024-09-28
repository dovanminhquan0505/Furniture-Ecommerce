import React, { useState } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col } from "reactstrap";
import { motion } from "framer-motion";
import CommonSection from "../components/UI/CommonSection";
import { useLocation } from "react-router-dom";
import "../styles/checkout.css";
import "../styles/placeorder.css";
import { useSelector } from "react-redux";
// import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";

// Get Paypal Client from your environment
const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

const PlaceOrder = () => {
    const [loading, setLoading] = useState(false);
    // Get billing information from state passed via navigate
    const location = useLocation();
    const { billingInfo } = location.state || {};

    // Retrieve total price details from Redux store
    const totalQty = useSelector((state) => state.cart.totalQuantity);
    const totalAmount = useSelector((state) => state.cart.totalAmount);
    const totalShipping = useSelector((state) => state.cart.totalShipping);
    const totalTax = useSelector((state) => state.cart.totalTax);
    const totalPrice = useSelector((state) => state.cart.totalPrice);

    // Retrieve cart items
    const cartItems = useSelector((state) => state.cart.cartItems);

    // State for showing PayPal checkout
    const [showPaypal, setShowPaypal] = useState(false);

    const handleConfirmOrder = () => {
        // Display paypal button when user clicks on Confirm order button
        setShowPaypal(true);
    };

    return (
        <Helmet title=" Place Order">
            <CommonSection title="Place Order" />

            <section>
                <Container>
                    <Row>
                        {/* Billing information summary */}
                        <Col lg="8">
                            <div className="border rounded p-3 mb-4">
                                <h6 className="mb-3 fw-bold">Shipping</h6>
                                <div className="billing__info">
                                    <p className="info__details">
                                        <strong>Name: </strong>
                                        {billingInfo?.name || "N/A"}
                                    </p>
                                    <p>
                                        <strong>Email: </strong>
                                        {billingInfo?.email || "N/A"}
                                    </p>
                                    <p>
                                        <strong>Phone: </strong>
                                        {billingInfo?.phone || "N/A"}
                                    </p>
                                    <p>
                                        <strong>Address: </strong>
                                        {billingInfo?.address || "N/A"}
                                    </p>
                                    <p>
                                        <strong>City: </strong>
                                        {billingInfo?.city || "N/A"}
                                    </p>
                                    <p>
                                        <strong>Postal Code: </strong>
                                        {billingInfo?.postalCode || "N/A"}
                                    </p>
                                    <p>
                                        <strong>Country: </strong>
                                        {billingInfo?.country || "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div className="border rounded p-3 mb-4">
                                <h6 className="mb-3 fw-bold">Payment</h6>
                                <p className="mb-0">Payment Method: Paypal</p>
                            </div>

                            <div className="border rounded p-3 mb-4">
                                <div className="cart__items-heading d-flex align-items-center justify-content-between">
                                    <h6 className="mb-3 fw-bold">
                                        Shopping Cart
                                    </h6>
                                    <div className="price__cartItem">Price</div>
                                </div>

                                <div className="cart__items-list">
                                    {cartItems.map((item, index) => (
                                        <div key={index} className="cart__item">
                                            <img
                                                src={item.imgUrl}
                                                alt={item.productName}
                                                className="cart__item-img"
                                            />
                                            <div className="cart__item-info">
                                                <h6>{item.productName}</h6>
                                                <p>Qty: {item.quantity}</p>
                                            </div>
                                            <div className="cart__item-price">
                                                <p>${item.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                            ? " item"
                                            : " items"}
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
                                    onClick={handleConfirmOrder}
                                >
                                    Confirm Order
                                </motion.button>

                                {/* Display Paypal if user clicks on Confirm button */}
                                {loading ? (
                                    <h4 className="fw-bold text-center">
                                        Loading....
                                    </h4>
                                ) : (
                                    showPaypal && (
                                        <div
                                            className="mt-3"
                                            id="paypal-button"
                                        />
                                    )
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default PlaceOrder;
