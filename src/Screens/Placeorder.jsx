import React, { useState, useEffect } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Spinner } from "reactstrap";
import { motion } from "framer-motion";
import CommonSection from "../components/UI/CommonSection";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/checkout.css";
import "../styles/placeorder.css";
import { useSelector } from "react-redux";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.config";
import useAuth from "../custom-hooks/useAuth";
import useAdmin from "../custom-hooks/useAdmin";

// Get Paypal Client from your environment
const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

const PlaceOrder = () => {
    const { orderId } = useParams();
    const [loading, setLoading] = useState(false);
    const [isFetchingOrder, setIsFetchingOrder] = useState(true);
    const navigate = useNavigate();
    const { isAdmin, isLoading: adminLoading } = useAdmin();
    const [orderDetails, setOrderDetails] = useState(null);
    const [showPaypal, setShowPaypal] = useState(false);

    useEffect(() => {
        if (!orderId) {
            // If there's no orderId, redirect back to checkout
            navigate("/checkout");
        }

        // Get order details from Firestore
        const fetchOrderDetails = async () => {
            try {
                setIsFetchingOrder(true);
                const orderRef = doc(db, "orders", orderId);
                const orderSnap = await getDoc(orderRef);
                if (orderSnap.exists()) {
                    const data = orderSnap.data();
                    // Convert Firestore Timestamp to Date object
                    if (data.paidAt && data.paidAt instanceof Timestamp) {
                        data.paidAt = data.paidAt.toDate();
                    }
                    if (
                        data.deliveredAt &&
                        data.deliveredAt instanceof Timestamp
                    ) {
                        data.deliveredAt = data.deliveredAt.toDate();
                    }

                    // Store order data in the component's state.
                    setOrderDetails(data);
                } else {
                    toast.error("Order not found");
                    navigate("/checkout");
                }
            } catch (error) {
                toast.error("Error fetching order details: " + error.message);
            } finally {
                setIsFetchingOrder(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, navigate]);

    // Get order details
    const cartItems = orderDetails ? orderDetails.cartItems : [];

    const handleConfirmOrder = () => {
        setShowPaypal(true);
    };

    // Handle Payment
    const handlePaymentSuccess = async (details) => {
        try {
            setLoading(true);
            const orderRef = doc(db, "orders", orderId);
            const paidAt = new Date();
            await updateDoc(orderRef, {
                isPaid: true,
                paidAt: Timestamp.fromDate(paidAt),
                paymentResult: {
                    id: details.id,
                    status: details.status,
                    update_time: details.update_time,
                    email_address: details.payer.email_address,
                },
            });

            setOrderDetails((prevDetails) => ({
                ...prevDetails,
                isPaid: true,
                paidAt: paidAt,
            }));

            toast.success("Payment successful!");
        } catch (error) {
            toast.error("Error updating order: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Deliver Order, only admin
    const handleDeliveryConfirmation = async () => {
        if (!isAdmin) {
            toast.error("Only admins can confirm delivery");
            return;
        }

        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                isDelivered: true,
                deliveredAt: Timestamp.fromDate(new Date()),
            });
            setOrderDetails((prev) => ({
                ...prev,
                isDelivered: true,
                deliveredAt: new Date(),
            }));
            toast.success("Order marked as delivered");
        } catch (error) {
            toast.error("Error updating order: " + error.message);
        }
    };

    // Handle display Date
    const formatDate = (date) => {
        return date instanceof Date ? date.toLocaleString() : "N/A";
    };

    if (adminLoading || isFetchingOrder) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    const shouldShowPaypal = orderDetails && !orderDetails.isPaid && showPaypal;
    const shouldShowConfirmOrderBtn =
        !isAdmin && orderDetails && !orderDetails.isPaid && !showPaypal;
    const shouldShowConfirmDeliverBtn =
        isAdmin &&
        orderDetails &&
        orderDetails.isPaid &&
        !orderDetails.isDelivered;

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
                                    <p>
                                        <strong>Name: </strong>
                                        {orderDetails.billingInfo.name}
                                    </p>
                                    <p>
                                        <strong>Email: </strong>
                                        {orderDetails.billingInfo.email}
                                    </p>
                                    <p>
                                        <strong>Phone: </strong>
                                        {orderDetails.billingInfo.phone}
                                    </p>
                                    <p>
                                        <strong>Address: </strong>
                                        {orderDetails.billingInfo.address}
                                    </p>
                                    <p>
                                        <strong>City: </strong>
                                        {orderDetails.billingInfo.city}
                                    </p>
                                    <p>
                                        <strong>Postal Code: </strong>
                                        {orderDetails.billingInfo.postalCode}
                                    </p>
                                    <p>
                                        <strong>Country: </strong>
                                        {orderDetails.billingInfo.country}
                                    </p>
                                </div>

                                <div className="mt-3">
                                    <p
                                        className={
                                            orderDetails.isDelivered
                                                ? "text-success"
                                                : "text-danger"
                                        }
                                    >
                                        {orderDetails.isDelivered
                                            ? `Delivered at ${formatDate(
                                                  orderDetails.deliveredAt
                                              )}`
                                            : "Not Delivered"}
                                    </p>
                                </div>
                            </div>

                            <div className="border rounded p-3 mb-4">
                                <h6 className="mb-3 fw-bold">Payment</h6>
                                <p className="mb-0">Payment Method: Paypal</p>
                                <p
                                    className={
                                        orderDetails.isPaid
                                            ? "text-success mt-2"
                                            : "text-danger mt-2"
                                    }
                                >
                                    {orderDetails.isPaid
                                        ? `Paid at ${formatDate(
                                              orderDetails.paidAt
                                          )}`
                                        : "Not Paid"}
                                </p>
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
                                        {orderDetails.totalQuantity || 0} items
                                    </span>
                                </h6>
                                <h6>
                                    Subtotal:
                                    <span>${orderDetails.totalAmount}</span>
                                </h6>
                                <h6>
                                    <span>Shipping:</span>
                                    <span>${orderDetails.totalShipping}</span>
                                </h6>
                                <h6>
                                    Tax: <span>${orderDetails.totalTax} </span>
                                </h6>
                                <h4>
                                    Total Cost:
                                    <span>${orderDetails.totalPrice}</span>
                                </h4>

                                {shouldShowConfirmOrderBtn && (
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 1.1 }}
                                        className="buy__btn auth__btn w-100"
                                        onClick={handleConfirmOrder}
                                    >
                                        Proceed to Payment
                                    </motion.button>
                                )}

                                {/* Display Paypal if user clicks on Confirm button */}
                                {shouldShowPaypal && (
                                    <PayPalScriptProvider
                                        options={{ "client-id": clientId }}
                                    >
                                        <PayPalButtons
                                            createOrder={(data, actions) => {
                                                return actions.order.create({
                                                    purchase_units: [
                                                        {
                                                            amount: {
                                                                value: orderDetails.totalPrice.toString(),
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

                                {shouldShowConfirmDeliverBtn && (
                                    <motion.button
                                        whileTap={{ scale: 1.1 }}
                                        className="buy__btn auth__btn w-100"
                                        onClick={handleDeliveryConfirmation}
                                    >
                                        Confirm Delivery
                                    </motion.button>
                                )}

                                {loading && (
                                    <Container
                                        className="d-flex justify-content-center align-items-center"
                                        style={{ height: "100vh" }}
                                    >
                                        <Spinner
                                            animation="border"
                                            role="status"
                                        >
                                            <span className="visually-hidden">
                                                Loading...
                                            </span>
                                        </Spinner>
                                    </Container>
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
