import React, { useState, useEffect } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Spinner, Form } from "reactstrap";
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
import {
    cancelOrder,
    createStripePaymentIntent,
    fetchSellerInfo,
    getOrderById,
    processRefund,
    requestRefund,
    updateOrder,
    uploadFile,
} from "../api";
import {
    CardElement,
    Elements,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CancelOrderForm from "../components/Refund/CancelOrderForm.jsx";
import RefundRequestForm from "../components/Refund/RefundRequestForm.jsx";
import Modal from "../components/Modal/Modal.jsx";

// eslint-disable-next-line no-undef
// Get Paypal Client from your environment
const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
const paypalIcon =
    "https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg";
const momoIcon = "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png";
const stripeIcon = "https://stripe.com/img/v3/home/social.png";

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
    const [loading, setLoading] = useState(false);
    const [isFetchingOrder, setIsFetchingOrder] = useState(true);
    const navigate = useNavigate();
    const { isSeller, isLoading: sellerLoading } = useSeller();
    const [orderDetails, setOrderDetails] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const dispatch = useDispatch();
    const [sellerNames, setSellerNames] = useState({});
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [selectedSubOrderId, setSelectedSubOrderId] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);

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
                    const isoMatch = paidAt.match(
                        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
                    );
                    if (isoMatch) {
                        paidAt = new Date(paidAt);
                        const offsetMinutes = 7 * 60; // UTC+7
                        paidAt.setMinutes(
                            paidAt.getMinutes() +
                                paidAt.getTimezoneOffset() +
                                offsetMinutes
                        );
                    } else if (paidAt.includes(" at ")) {
                        paidAt = new Date(
                            paidAt
                                .replace(" at ", " ")
                                .replace(" UTC+7", "+0700")
                        );
                    }
                } else if (paidAt && paidAt.toDate) {
                    paidAt = paidAt.toDate();
                }

                let deliveredAt = response.totalOrder.deliveredAt;
                if (typeof deliveredAt === "string") {
                    const isoMatch = deliveredAt.match(
                        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
                    );
                    if (isoMatch) {
                        deliveredAt = new Date(deliveredAt);
                        const offsetMinutes = 7 * 60; // UTC+7
                        deliveredAt.setMinutes(
                            deliveredAt.getMinutes() +
                                deliveredAt.getTimezoneOffset() +
                                offsetMinutes
                        );
                    } else if (deliveredAt.includes(" at ")) {
                        deliveredAt = new Date(
                            deliveredAt
                                .replace(" at ", " ")
                                .replace(" UTC+7", "+0700")
                        );
                    }
                } else if (deliveredAt && deliveredAt.toDate) {
                    deliveredAt = deliveredAt.toDate();
                }

                setOrderDetails({
                    totalOrder: {
                        ...response.totalOrder,
                        paidAt,
                        deliveredAt,
                        refundStatus:
                            response.totalOrder.refundStatus || "None",
                    },
                    subOrders: response.subOrders,
                });

                // Fetch seller names for each subOrder
                const sellerNamesData = {};
                for (const subOrder of response.subOrders) {
                    const sellerInfo = await fetchSellerInfo(subOrder.sellerId);
                    sellerNamesData[subOrder.sellerId] =
                        sellerInfo.storeName || "Unknown Store";
                }
                setSellerNames(sellerNamesData);
            } catch (error) {
                toast.error("Error fetching order details: " + error.message);
                navigate("/checkout");
            } finally {
                setIsFetchingOrder(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, navigate]);

    // Tính toán thời gian còn lại để hủy đơn hàng
    useEffect(() => {
        if (orderDetails?.totalOrder?.createdAt) {
            const createdAt = new Date(orderDetails.totalOrder.createdAt);
            const fiveMinutesLater = new Date(
                createdAt.getTime() + 5 * 60 * 1000
            );
            const interval = setInterval(() => {
                const now = new Date();
                const timeDiff = fiveMinutesLater - now;
                if (timeDiff <= 0) {
                    setTimeLeft(0);
                    clearInterval(interval);
                } else {
                    setTimeLeft(Math.floor(timeDiff / 1000));
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [orderDetails]);

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

    const handleConfirmOrder = () => {
        setShowPayment(true);
    };

    const handleSelectPaymentMethod = (method) => {
        setSelectedPaymentMethod(method);
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

    const handleCancelOrder = async ({ reason }, subOrderId) => {
        try {
            setLoading(true);
            const response = await cancelOrder(orderId, { reason });
            if (response.message.includes("awaiting seller approval")) {
                setOrderDetails((prev) => ({
                    ...prev,
                    totalOrder: {
                        ...prev.totalOrder,
                        cancelStatus: "Requested",
                    },
                }));
                toast.success(
                    "Cancellation request submitted, awaiting seller approval!"
                );
            } else {
                setOrderDetails((prev) => ({
                    ...prev,
                    totalOrder: { ...prev.totalOrder, status: "cancelled" },
                }));
                toast.success("Order cancelled successfully!");
            }
            setShowRefundModal(false);
            setSelectedSubOrderId(null);
        } catch (error) {
            toast.error(error.message || "Error cancelling order");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestRefund = async ({ reason, files }, subOrderId) => {
        try {
            setLoading(true);
            let evidence = [];
            if (files.length > 0) {
                const uploadPromises = files.map((file) => uploadFile(file));
                const uploadResults = await Promise.all(uploadPromises);
                evidence = uploadResults.map((result) => result.fileURL);
            }
            await requestRefund(orderId, { reason, evidence });
            setOrderDetails((prev) => ({
                ...prev,
                totalOrder: { ...prev.totalOrder, refundStatus: "Requested" },
            }));
            setShowRefundModal(false);
            setSelectedSubOrderId(null);
            toast.success(
                totalOrder.status === "success"
                    ? "Return & Refund request submitted successfully!"
                    : "Order cancellation request submitted successfully!"
            );
        } catch (error) {
            toast.error("Error requesting refund: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessRefund = async (action) => {
        if (!isSeller) {
            toast.error("Only sellers can process refunds");
            return;
        }
        try {
            setLoading(true);
            await processRefund(orderId, action);
            setOrderDetails((prev) => ({
                ...prev,
                totalOrder: {
                    ...prev.totalOrder,
                    refundStatus:
                        action === "approve" ? "Refunded" : "Rejected",
                },
            }));
            toast.success(`Refund ${action}ed successfully!`);
        } catch (error) {
            toast.error("Error processing refund: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Buy Again
    const handleBuyAgain = (item) => {
        dispatch(
            cartActions.addItem({
                id: item.id,
                productName: item.productName,
                price: item.price,
                imgUrl: item.imgUrl,
                quantity: 1,
            })
        );
        toast.success(`${item.productName} đã được thêm vào giỏ hàng!`);
        navigate("/cart");
    };

    const renderSubOrderItems = () => {
        return subOrders.map((subOrder) => {
            const subOrderId = subOrder.id;

            // Điều kiện hiển thị nút "Cancel Order"
            const shouldShowCancelBtn =
                !isSeller &&
                totalOrder.isPaid &&
                (subOrder.status === "pending" ||
                    subOrder.status === "processing") &&
                totalOrder.refundStatus === "None" &&
                totalOrder.cancelStatus !== "Requested";

            // Điều kiện hiển thị nút "Return & Refund"
            const shouldShowRefundBtn =
                !isSeller &&
                totalOrder.isPaid &&
                subOrder.status === "success" &&
                totalOrder.refundStatus === "None" &&
                totalOrder.cancelStatus !== "Requested" &&
                !totalOrder.isDelivered;

            return (
                <div key={subOrder.id} className="border rounded p-3 mb-3">
                    <h6 className="seller__store">
                        <i className="fas fa-store me-1"></i>
                        <div className="fw-bold">
                            {sellerNames[subOrder.sellerId] || "Đang tải..."}
                        </div>
                    </h6>
                    {subOrder.items.map((item, index) => (
                        <div key={index} className="cart__item">
                            <img
                                src={item.imgUrl}
                                alt={item.productName}
                                className="cart__item-img"
                            />
                            <div className="cart__item-info">
                                <h6>{item.productName}</h6>
                                <p>
                                    Qty: {item.quantity} | Status:{" "}
                                    {subOrder.status || "Pending"}
                                </p>
                            </div>
                            <div className="cart__item-price">
                                <span className="price__cartItem">
                                    ${item.price}
                                </span>
                            </div>
                        </div>
                    ))}
                    {totalOrder.cancelStatus === "Requested" && (
                        <p className="text-warning">
                            Cancellation request pending approval
                        </p>
                    )}
                    {(shouldShowCancelBtn || shouldShowRefundBtn) && (
                        <div className="suborder__actions">
                            <motion.button
                                whileTap={{ scale: 1.1 }}
                                className="refund__btn"
                                onClick={() => {
                                    setSelectedSubOrderId(subOrderId);
                                    setShowRefundModal(true);
                                }}
                            >
                                {shouldShowRefundBtn
                                    ? "Return/Refund"
                                    : "Cancel Order"}
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 1.1 }}
                                className="buy-again__btn"
                                onClick={() => handleBuyAgain(subOrder)}
                            >
                                Buy Again
                            </motion.button>
                        </div>
                    )}
                </div>
            );
        });
    };

    // Handle display Date
    const formatDate = (date) => {
        if (!date) return "N/A";

        let parsedDate;
        if (typeof date === "string") {
            const isoMatch = date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            if (isoMatch) {
                parsedDate = new Date(date);
                const offsetMinutes = 7 * 60; // UTC+7
                parsedDate.setMinutes(
                    parsedDate.getMinutes() +
                        parsedDate.getTimezoneOffset() +
                        offsetMinutes
                );
            } else if (date.includes(" at ")) {
                parsedDate = new Date(
                    date.replace(" at ", " ").replace(" UTC+7", "+0700")
                );
            }
        } else if (date instanceof Date) {
            parsedDate = date;
        } else if (date.toDate) {
            parsedDate = date.toDate();
        } else {
            return "N/A";
        }

        if (isNaN(parsedDate.getTime())) return "N/A";
        return parsedDate.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

    const shouldShowProceedToPaymentBtn =
        !isSeller && totalOrder && !totalOrder.isPaid && !showPayment;
    const shouldShowPaypal =
        totalOrder && !totalOrder.isPaid && selectedPaymentMethod === "paypal";
    const shouldShowMomo =
        totalOrder && !totalOrder.isPaid && selectedPaymentMethod === "momo";
    const shouldShowStripe =
        totalOrder && !totalOrder.isPaid && selectedPaymentMethod === "stripe";
    const shouldShowRefundStatus = totalOrder.refundStatus !== "None";
    const shouldShowProcessRefundBtn =
        isSeller && totalOrder.refundStatus === "Requested";

    return (
        <Helmet title=" Place Order">
            <CommonSection title="Place Order" />

            <section>
                <Container>
                    <Row>
                        {/* Billing information summary */}
                        <Col lg="8">
                            {/* Back Arrow */}
                            {!totalOrder.isPaid && (
                                <motion.i
                                    className="fas fa-arrow-left back__arrow"
                                    onClick={() =>
                                        navigate("/checkout", {
                                            state: { ...totalOrder },
                                        })
                                    }
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                />
                            )}
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
                                    {shouldShowRefundStatus && (
                                        <p
                                            className={
                                                totalOrder.refundStatus ===
                                                "Refunded"
                                                    ? "text-success"
                                                    : "text-warning"
                                            }
                                        >
                                            Refund Status:{" "}
                                            {totalOrder.refundStatus}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="border rounded p-3 mb-4">
                                <h6 className="mb-3 fw-bold">Shopping Cart</h6>
                                {renderSubOrderItems()}
                            </div>
                            {/* Modal hiển thị RefundForm */}
                            <Modal
                                isOpen={showRefundModal}
                                onClose={() => {
                                    setShowRefundModal(false);
                                    setSelectedSubOrderId(null);
                                }}
                            >
                                {selectedSubOrderId &&
                                    (() => {
                                        const selectedSubOrder = subOrders.find(
                                            (sub) =>
                                                sub.id === selectedSubOrderId
                                        );
                                        const isSuccess =
                                            selectedSubOrder?.status ===
                                            "success";

                                        return (
                                            <>
                                                {isSuccess ? (
                                                    <RefundRequestForm
                                                        orderId={orderId}
                                                        subOrder={{
                                                            ...selectedSubOrder,
                                                            sellerName:
                                                                sellerNames[
                                                                    selectedSubOrder
                                                                        .sellerId
                                                                ],
                                                        }}
                                                        onRequestRefund={(
                                                            data
                                                        ) =>
                                                            handleRequestRefund(
                                                                data,
                                                                selectedSubOrderId
                                                            )
                                                        }
                                                        onCancel={() => {
                                                            setShowRefundModal(
                                                                false
                                                            );
                                                            setSelectedSubOrderId(
                                                                null
                                                            );
                                                        }}
                                                        loading={loading}
                                                    />
                                                ) : (
                                                    <CancelOrderForm
                                                        orderId={orderId}
                                                        subOrder={{
                                                            ...selectedSubOrder,
                                                            sellerName:
                                                                sellerNames[
                                                                    selectedSubOrder
                                                                        .sellerId
                                                                ],
                                                        }}
                                                        onCancelOrder={(data) =>
                                                            handleCancelOrder(
                                                                data,
                                                                selectedSubOrderId
                                                            )
                                                        }
                                                        onCancel={() => {
                                                            setShowRefundModal(
                                                                false
                                                            );
                                                            setSelectedSubOrderId(
                                                                null
                                                            );
                                                        }}
                                                        loading={loading}
                                                    />
                                                )}
                                            </>
                                        );
                                    })()}
                            </Modal>
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

                                {shouldShowProceedToPaymentBtn && (
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 1.1 }}
                                        className="buy__btn auth__btn w-100"
                                        onClick={handleConfirmOrder}
                                    >
                                        Proceed to Payment
                                    </motion.button>
                                )}

                                {/* Display Payment Options */}
                                {showPayment && !totalOrder.isPaid && (
                                    <div className="payment__options">
                                        <motion.button
                                            whileTap={{ scale: 1.1 }}
                                            className={`payment__option ${
                                                selectedPaymentMethod ===
                                                "paypal"
                                                    ? "payment__option--selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleSelectPaymentMethod(
                                                    "paypal"
                                                )
                                            }
                                        >
                                            <img
                                                src={paypalIcon}
                                                alt="PayPal"
                                                className="payment__icon"
                                            />
                                            PayPal
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 1.1 }}
                                            className={`payment__option ${
                                                selectedPaymentMethod === "momo"
                                                    ? "payment__option--selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleSelectPaymentMethod(
                                                    "momo"
                                                )
                                            }
                                        >
                                            <img
                                                src={momoIcon}
                                                alt="MoMo"
                                                className="payment__icon"
                                            />
                                            MoMo
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 1.1 }}
                                            className={`payment__option ${
                                                selectedPaymentMethod ===
                                                "stripe"
                                                    ? "payment__option--selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleSelectPaymentMethod(
                                                    "stripe"
                                                )
                                            }
                                        >
                                            <img
                                                src={stripeIcon}
                                                alt="Stripe"
                                                className="payment__icon"
                                            />
                                            Stripe
                                        </motion.button>
                                    </div>
                                )}

                                {/* Payment Container */}
                                <div className="payment__container">
                                    {/* Display PayPal if selected */}
                                    {shouldShowPaypal && (
                                        <div className="paypal__buttons">
                                            <PayPalScriptProvider
                                                options={{
                                                    "client-id": clientId,
                                                }}
                                            >
                                                <PayPalButtons
                                                    createOrder={(
                                                        data,
                                                        actions
                                                    ) => {
                                                        return actions.order.create(
                                                            {
                                                                purchase_units:
                                                                    [
                                                                        {
                                                                            amount: {
                                                                                value: totalOrder.totalPrice.toString(),
                                                                            },
                                                                        },
                                                                    ],
                                                            }
                                                        );
                                                    }}
                                                    onApprove={(
                                                        data,
                                                        actions
                                                    ) => {
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
                                        </div>
                                    )}

                                    {/* Display MoMo payment button if selected */}
                                    {shouldShowMomo && (
                                        <div className="momo__button">
                                            <motion.button
                                                whileTap={{ scale: 1.1 }}
                                                className="buy__btn auth__btn w-100"
                                                onClick={() =>
                                                    handlePaymentSuccess(
                                                        {
                                                            id:
                                                                "momo_" +
                                                                Date.now(),
                                                            status: "completed",
                                                        },
                                                        "momo"
                                                    )
                                                }
                                            >
                                                Confirm MoMo Payment
                                            </motion.button>
                                        </div>
                                    )}

                                    {/* Display Stripe payment form if selected */}
                                    {shouldShowStripe && (
                                        <div className="stripe__form">
                                            <Elements stripe={stripePromise}>
                                                <CheckoutForm
                                                    orderId={orderId}
                                                    totalPrice={
                                                        totalOrder.totalPrice
                                                    }
                                                    onSuccess={(
                                                        paymentIntent
                                                    ) =>
                                                        handlePaymentSuccess(
                                                            paymentIntent,
                                                            "stripe"
                                                        )
                                                    }
                                                    billingInfo={
                                                        totalOrder.billingInfo
                                                    }
                                                />
                                            </Elements>
                                        </div>
                                    )}
                                </div>

                                {shouldShowProcessRefundBtn && (
                                    <div className="mt-3">
                                        <motion.button
                                            whileTap={{ scale: 1.1 }}
                                            className="buy__btn auth__btn w-100"
                                            onClick={() =>
                                                handleProcessRefund("approve")
                                            }
                                        >
                                            Approve Refund
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 1.1 }}
                                            className="buy__btn auth__btn w-100 mt-2"
                                            onClick={() =>
                                                handleProcessRefund("reject")
                                            }
                                        >
                                            Reject Refund
                                        </motion.button>
                                    </div>
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
