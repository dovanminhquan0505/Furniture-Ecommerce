import React, { useState, useEffect } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Spinner } from "reactstrap";
import { motion } from "framer-motion";
import CommonSection from "../components/UI/CommonSection";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/checkout.css";
import "../styles/placeorder.css";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";
import { cartActions } from "../redux/slices/cartSlice";
import { useDispatch } from "react-redux";
import useSeller from "../custom-hooks/useSeller";
import { createStripePaymentIntent, getOrderById, updateOrder } from "../api";
import {
    CardElement,
    Elements,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// eslint-disable-next-line no-undef
// Get Paypal Client from your environment
const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ orderId, totalPrice, onSuccess, billingInfo }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);

        try {
            const { clientSecret } = await createStripePaymentIntent(
                orderId,
                totalPrice * 100
            );

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        email: billingInfo?.email || "unknown@example.com",
                        name: billingInfo?.name,
                        address: {
                            city: billingInfo?.city,
                            country: billingInfo?.country,
                            line1: billingInfo?.address,
                            postal_code: billingInfo?.postalCode,
                        },
                    },
                },
            });

            if (result.error) {
                toast.error(result.error.message);
            } else if (result.paymentIntent.status === "succeeded") {
                onSuccess(result.paymentIntent);
            }
        } catch (error) {
            toast.error("Error processing Stripe payment: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardElement
                options={{
                    style: {
                        base: {
                            fontSize: "16px",
                            color: "#424770",
                            "::placeholder": {
                                color: "#aab7c4",
                            },
                        },
                        invalid: {
                            color: "#9e2146",
                        },
                    },
                    hidePostalCode: false,
                }}
            />
            <motion.button
                whileTap={{ scale: 1.1 }}
                className="buy__btn auth__btn w-100 mt-3"
                disabled={!stripe || loading}
            >
                {loading ? "Processing..." : "Pay with Stripe"}
            </motion.button>
        </form>
    );
};

const PlaceOrder = () => {
    const { orderId } = useParams();
    const { state } = useLocation();
    const [loading, setLoading] = useState(false);
    const [isFetchingOrder, setIsFetchingOrder] = useState(true);
    const navigate = useNavigate();
    const { isSeller, isLoading: sellerLoading } = useSeller();
    const [orderDetails, setOrderDetails] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const dispatch = useDispatch();
    const paymentMethod = state?.paymentMethod || "paypal";

    useEffect(() => {
        if (!orderId) {
            navigate("/checkout");
            return;
        }

        const fetchOrderDetails = async () => {
            try {
                setIsFetchingOrder(true);
                const response = await getOrderById(orderId);

                let paidAt = response.totalOrder.paidAt;
                if (typeof paidAt === "string") {
                    paidAt = new Date(paidAt.replace(" at ", " ").replace(" UTC+7", "+0700"));
                } else if (paidAt && paidAt.toDate) {
                    paidAt = paidAt.toDate();
                }

                setOrderDetails({
                    totalOrder: {
                        ...response.totalOrder,
                        paidAt,
                    },
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
        setShowPayment(true);
    };

    // Handle Payment
    const handlePaymentSuccess = async (details, paymentMethod) => {
        try {
            setLoading(true);
            const paidAt = new Date().toISOString();
            let paymentResult;

            // Xử lý paymentResult dựa trên phương thức thanh toán
            switch (paymentMethod) {
                case "paypal":
                    paymentResult = {
                        id: details.id,
                        status: details.status,
                        update_time: details.update_time || paidAt,
                        email_address: details.payer?.email_address || "N/A",
                    };
                    break;
                case "stripe":
                    paymentResult = {
                        id: details.id,
                        status: details.status,
                        update_time: details.created || paidAt,
                        email_address: details.billing_details?.email || "N/A",
                    };
                    break;
                case "momo":
                    paymentResult = {
                        method: "momo",
                        status: "completed",
                        update_time: paidAt,
                    };
                    break;
                default:
                    paymentResult = {
                        id: details.id || "unknown",
                        status: details.status || "unknown",
                        update_time: paidAt,
                        email_address: "N/A",
                    };
            }

            await updateOrder(orderId, {
                isPaid: true,
                paidAt,
                paymentResult,
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

    // Handle MoMo Payment (Giả lập)
    const handleMoMoPayment = async () => {
        try {
            setLoading(true);
            const paidAt = new Date().toISOString();

            // Giả lập thanh toán thành công (thay bằng API MoMo thực tế sau)
            await updateOrder(orderId, {
                isPaid: true,
                paidAt,
                paymentResult: {
                    method: "momo",
                    status: "completed",
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
            toast.success("MoMo payment successful!");
        } catch (error) {
            toast.error("Error processing MoMo payment: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Deliver Order, only seller
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
        if (!date) return "N/A";
    
        let parsedDate;
        if (typeof date === "string") {
            parsedDate = new Date(date.replace(" at ", " ").replace(" UTC+7", "+0700"));
        } else if (date instanceof Date) {
            parsedDate = date;
        } else if (date.toDate) { 
            parsedDate = date.toDate();
        } else {
            return "N/A";
        }
    
        if (isNaN(parsedDate.getTime())) return "N/A";
        return parsedDate.toLocaleString();
    };

    const shouldShowConfirmOrderBtn =
        !isSeller && totalOrder && !totalOrder.isPaid && !showPayment;
    const shouldShowPaypal =
        totalOrder &&
        !totalOrder.isPaid &&
        showPayment &&
        paymentMethod === "paypal";
    const shouldShowMomo =
        totalOrder &&
        !totalOrder.isPaid &&
        showPayment &&
        paymentMethod === "momo";
    const shouldShowStripe =
        totalOrder &&
        !totalOrder.isPaid &&
        showPayment &&
        paymentMethod === "stripe";
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
                                <p className="mb-0">
                                    Payment Method:{" "}
                                    {totalOrder.paymentMethod === "momo"
                                        ? "MoMo"
                                        : totalOrder.paymentMethod === "stripe"
                                        ? "Stripe"
                                        : "PayPal"}
                                </p>
                                <p
                                    className={
                                        totalOrder.isPaid
                                            ? "text-success mt-2"
                                            : "text-danger mt-2"
                                    }
                                >
                                    {totalOrder.isPaid && totalOrder.paidAt
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
                                                            details,
                                                            "paypal"
                                                        );
                                                    });
                                            }}
                                        />
                                    </PayPalScriptProvider>
                                )}

                                {/* Display MoMo payment button if payment method is MoMo */}
                                {shouldShowMomo && (
                                    <motion.button
                                        whileTap={{ scale: 1.1 }}
                                        className="buy__btn auth__btn w-100"
                                        onClick={() =>
                                            handlePaymentSuccess(
                                                {
                                                    id: "momo_" + Date.now(),
                                                    status: "completed",
                                                },
                                                "momo"
                                            )
                                        }
                                    >
                                        Confirm MoMo Payment
                                    </motion.button>
                                )}

                                {shouldShowStripe && (
                                    <Elements stripe={stripePromise}>
                                        <CheckoutForm
                                            orderId={orderId}
                                            totalPrice={totalOrder.totalPrice}
                                            onSuccess={(paymentIntent) =>
                                                handlePaymentSuccess(
                                                    paymentIntent,
                                                    "stripe"
                                                )
                                            }
                                            billingInfo={totalOrder.billingInfo}
                                        />
                                    </Elements>
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
