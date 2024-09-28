import React, { useState, useEffect } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col } from "reactstrap";
import { motion } from "framer-motion";
import CommonSection from "../components/UI/CommonSection";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/checkout.css";
import "../styles/placeorder.css";
import { useSelector } from "react-redux";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.config";

// Get Paypal Client from your environment
const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

const PlaceOrder = () => {
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Retrieve billing information
    const { billingInfo, orderId } = location.state || {};

    useEffect(() => {
        if(!orderId) {
            // If there's no orderId, redirect back to checkout
            navigate('/checkout');
        }
    }, [orderId, navigate]);

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

    const handlePaymentSuccess = async (details) => {
        try {
            setLoading(true);
            // Use the orderId to update the specific order
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                isPaid: true,
                paidAt: new Date(),
                paymentResult: {
                    id: details.id,
                    status: details.status,
                    update_time: details.update_time,
                    email_address: details.payer.email_address,
                },
            });

            toast.success("Payment successful!");
        } catch (error) {
            toast.error("Error updating order: " + error.message);
        } finally {
            setLoading(false);
        }
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

                                {!showPaypal && (
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 1.1 }}
                                        className="buy__btn auth__btn w-100"
                                        onClick={handleConfirmOrder}
                                    >
                                        Confirm Order
                                    </motion.button>
                                )}

                                {/* Display Paypal if user clicks on Confirm button */}
                                {showPaypal && (
                                    <PayPalScriptProvider
                                        options={{ "client-id": clientId }}
                                    >
                                        <PayPalButtons
                                            createOrder={(data, actions) => {
                                                return actions.order.create({
                                                    purchase_units: [
                                                        {
                                                            amount: {
                                                                value: totalPrice.toString(),
                                                            },
                                                        },
                                                    ],
                                                });
                                            }}
                                            onApprove={(data, actions) => {
                                                return actions.order
                                                    .capture()
                                                    .then((details) => {
                                                        handlePaymentSuccess(
                                                            details
                                                        );
                                                    });
                                            }}
                                        />
                                    </PayPalScriptProvider>
                                )}

                                {loading && (
                                    <h4 className="fw-bold text-center">
                                        Processing...
                                    </h4>
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
