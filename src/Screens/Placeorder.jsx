import React, { useState, useEffect } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Spinner } from "reactstrap";
import { motion } from "framer-motion";
import CommonSection from "../components/UI/CommonSection";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/checkout.css";
import "../styles/placeorder.css";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";
import { cartActions } from "../redux/slices/cartSlice";
import { useDispatch } from "react-redux";
import useSeller from "../custom-hooks/useSeller";
import { getOrderById, updateOrder } from "../api";

// Get Paypal Client from your environment
const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

const PlaceOrder = () => {
    const { orderId } = useParams();
    const [loading, setLoading] = useState(false);
    const [isFetchingOrder, setIsFetchingOrder] = useState(true);
    const navigate = useNavigate();
    const { isSeller, isLoading: sellerLoading } = useSeller();
    const [orderDetails, setOrderDetails] = useState(null);
    const [showPaypal, setShowPaypal] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!orderId) {
            navigate("/checkout");
            return;
        }

        const fetchOrderDetails = async () => {
            try {
                setIsFetchingOrder(true);
                const response = await getOrderById(orderId);
                setOrderDetails({
                    totalOrder: response.totalOrder,
                    subOrders: response.subOrders,
                });
            } catch (error) {
                toast.error("Error fetching order details: " + error.message);
                navigate("/checkout");
            } finally {
                setIsFetchingOrder(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, navigate]);

    if (sellerLoading || isFetchingOrder) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner style={{ width: "3rem", height: "3rem" }} />
                <span className="visually-hidden">Loading...</span>
            </Container>
        );
    }

    if (!orderDetails) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner style={{ width: "3rem", height: "3rem" }} />
                <span className="visually-hidden">Loading...</span>
            </Container>
        );
    }

    // Get order details
    const { totalOrder, subOrders } = orderDetails;
    const cartItems = totalOrder.items || [];

    const handleConfirmOrder = () => {
        setShowPaypal(true);
    };

    // Handle Payment
    const handlePaymentSuccess = async (details) => {
        try {
            setLoading(true);
            const paidAt = new Date().toISOString();

            await updateOrder(orderId, {
                isPaid: true,
                paidAt,
                paymentResult: {
                    id: details.id,
                    status: details.status,
                    update_time: details.update_time,
                    email_address: details.payer.email_address,
                },
            });

            setOrderDetails((prevDetails) => ({
                ...prevDetails,
                totalOrder: {
                    ...prevDetails.totalOrder,
                    isPaid: true,
                    paidAt: new Date(paidAt),
                },
            }));

            dispatch(cartActions.clearCart());
            toast.success("Payment successful!");
        } catch (error) {
            toast.error("Error updating order: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Deliver Order, only admin
    const handleDeliveryConfirmation = async () => {
        if (!isSeller) {
            toast.error("Only sellers can confirm delivery");
            return;
        }

        try {
            setLoading(true);
            const deliveredAt = new Date().toISOString();

            await updateOrder(orderId, {
                isDelivered: true,
                deliveredAt,
            });

            setOrderDetails((prev) => ({
                ...prev,
                totalOrder: {
                    ...prev.totalOrder,
                    isDelivered: true,
                    deliveredAt: new Date(deliveredAt),
                },
            }));
            toast.success("Order marked as delivered");
        } catch (error) {
            toast.error("Error updating order: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle display Date
    const formatDate = (date) => {
        return date instanceof Date ? date.toLocaleString() : "N/A";
    };

    const shouldShowPaypal = totalOrder && !totalOrder.isPaid && showPaypal;
    const shouldShowConfirmOrderBtn =
        !isSeller && totalOrder && !totalOrder.isPaid && !showPaypal;
    const shouldShowConfirmDeliverBtn =
        isSeller && totalOrder && totalOrder.isPaid && !totalOrder.isDelivered;

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
                                        {totalOrder.billingInfo?.name ||
                                            "No name available"}
                                    </p>
                                    <p>
                                        <strong>Email: </strong>
                                        {totalOrder.billingInfo?.email ||
                                            "No email available"}
                                    </p>
                                    <p>
                                        <strong>Phone: </strong>
                                        {totalOrder.billingInfo?.phone ||
                                            "No phone available"}
                                    </p>
                                    <p>
                                        <strong>Address: </strong>
                                        {totalOrder.billingInfo?.address ||
                                            "No address available"}
                                    </p>
                                    <p>
                                        <strong>City: </strong>
                                        {totalOrder.billingInfo?.city ||
                                            "No city available"}
                                    </p>
                                    <p>
                                        <strong>Postal Code: </strong>
                                        {totalOrder.billingInfo?.postalCode ||
                                            "No postal code available"}
                                    </p>
                                    <p> 
                                        <strong>Country: </strong>
                                        {totalOrder.billingInfo?.country ||
                                            "No country available country"}
                                    </p>
                                </div>

                                <div className="mt-3">
                                    <p
                                        className={
                                            totalOrder.isDelivered
                                                ? "text-success"
                                                : "text-danger"
                                        }
                                    >
                                        {totalOrder.isDelivered
                                            ? `Delivered at ${formatDate(
                                                  totalOrder.deliveredAt
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
                                        totalOrder.isPaid
                                            ? "text-success mt-2"
                                            : "text-danger mt-2"
                                    }
                                >
                                    {totalOrder.isPaid
                                        ? `Paid at ${formatDate(
                                              totalOrder.paidAt
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
                                        {totalOrder.totalQuantity || 0} items
                                    </span>
                                </h6>
                                <h6>
                                    Subtotal:
                                    <span>${totalOrder.totalAmount}</span>
                                </h6>
                                <h6>
                                    <span>Shipping:</span>
                                    <span>${totalOrder.totalShipping}</span>
                                </h6>
                                <h6>
                                    Tax: <span>${totalOrder.totalTax} </span>
                                </h6>
                                <h4>
                                    Total Cost:
                                    <span>${totalOrder.totalPrice}</span>
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
                                                                value: totalOrder.totalPrice.toString(),
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
                                            style={{
                                                width: "3rem",
                                                height: "3rem",
                                            }}
                                        />
                                        <span className="visually-hidden">
                                            Loading...
                                        </span>
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
