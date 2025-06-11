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
    appealRefund,
    cancelOrder,
    createStripePaymentIntent,
    customerConfirmReturn,
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
                Math.round(totalPrice * 100)
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
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [showAppealModal, setShowAppealModal] = useState(false);
    const [appealReason, setAppealReason] = useState("");
    const [showConfirmReturnModal, setShowConfirmReturnModal] = useState(false);
    const [confirmReturnData, setConfirmReturnData] = useState(null);
    const [appealFiles, setAppealFiles] = useState([]);
    const [selectedAppealItem, setSelectedAppealItem] = useState(null);

    const formatDate = (date) => {
        if (!date) return "N/A";

        let parsedDate;

        if (typeof date === "string") {
            // Normalize the input string by replacing non-breaking spaces and trimming
            const normalizedDate = date.replace(/\u202F/g, " ").trim();
            
            // Updated regex to be more flexible with spaces and UTC offset
            const firebaseDateRegex = /^([A-Za-z]+ \d{1,2}, \d{4})\s*at\s*(\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM))\s*UTC([+-])(\d+)$/i;
            
            if (firebaseDateRegex.test(normalizedDate)) {
                try {
                    const [, datePart, timePart, sign, offset] = normalizedDate.match(firebaseDateRegex);
                    const standardDate = `${datePart} ${timePart} ${sign}${offset.padStart(2, '0')}00`;
                    parsedDate = new Date(standardDate);

                    if (isNaN(parsedDate.getTime())) {
                        console.error("Invalid parsed Firebase date:", standardDate, normalizedDate);
                        return "N/A";
                    }
                } catch (error) {
                    console.error("Error parsing Firebase date:", error, normalizedDate);
                    return "N/A";
                }
            } else if (normalizedDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                parsedDate = new Date(normalizedDate);
                const offsetMinutes = 7 * 60; // UTC+7 offset
                parsedDate.setMinutes(
                    parsedDate.getMinutes() + parsedDate.getTimezoneOffset() + offsetMinutes
                );
            } else {
                parsedDate = new Date(normalizedDate);
            }
        } else if (date instanceof Date) {
            parsedDate = date;
        } else if (date && typeof date.toDate === "function") {
            parsedDate = date.toDate();
        } else if (date && typeof date === "object" && "_seconds" in date && "_nanoseconds" in date) {
            const milliseconds = date._seconds * 1000 + Math.floor(date._nanoseconds / 1000000);
            parsedDate = new Date(milliseconds);
        } else {
            console.error("Unsupported date format:", date);
            return "N/A";
        }

        if (!parsedDate || isNaN(parsedDate.getTime())) {
            console.error("Invalid date after parsing:", date);
            return "N/A";
        }

        return parsedDate.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

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
                    totalOrder: {
                        ...response.totalOrder,
                        paidAt: formatDate(response.totalOrder.paidAt),
                        deliveredAt: formatDate(
                            response.totalOrder.deliveredAt
                        ),
                        refundStatus:
                            response.totalOrder.refundStatus || "None",
                    },
                    subOrders: response.subOrders.map((sub) => ({
                        ...sub,
                        refundStatus: sub.refundStatus || "None",
                        cancelStatus: sub.cancelStatus || "None",
                        items: sub.items.map((item) => ({
                            ...item,
                            canceled: item.canceled || item.quantity === 0,
                        })),
                    })),
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
                    const captureId =
                        details.purchase_units?.[0]?.payments?.captures?.[0]
                            ?.id;
                    if (!captureId) {
                        throw new Error(
                            "Capture ID not found in PayPal response"
                        );
                    }
                    paymentResult = {
                        id: captureId,
                        orderId: details.id,
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

    const handleCancelOrder = async ({
        reason,
        itemId,
        quantity,
        subOrderId,
    }) => {
        try {
            if (!subOrderId) {
                toast.error("Invalid sub-order ID");
                return;
            }
            setLoading(true);
            const cancelId = `${subOrderId}-${itemId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const response = await cancelOrder(orderId, subOrderId, {
                reason,
                itemId,
                quantity,
                cancelId,
            });

            setOrderDetails((prev) => {
                const updatedSubOrders = prev.subOrders.map((sub) => {
                    if (sub.id === subOrderId) {
                        if (
                            response.message === "Order cancelled directly and refunded successfully" ||
                            response.message === "Order cancelled and refunded successfully"
                        ) {
                            const updatedItems = sub.items.map((item) => {
                                if (item.id === itemId) {
                                    const newQuantity = item.quantity - quantity;
                                    return {
                                        ...item,
                                        quantity: newQuantity,
                                        canceled: newQuantity === 0,
                                        originalQuantity: item.originalQuantity || item.quantity,
                                    };
                                }
                                return item;
                            });
                            const updatedTotalQuantity = updatedItems.reduce(
                                (sum, item) => sum + item.quantity,
                                0
                            );
                            const updatedTotalAmount = updatedItems.reduce(
                                (sum, item) => sum + item.price * item.quantity,
                                0
                            );
                            const updatedSubOrder = {
                                ...sub,
                                items: updatedItems,
                                totalQuantity: updatedTotalQuantity,
                                totalAmount: updatedTotalAmount,
                                cancelledItems: [
                                    ...(sub.cancelledItems || []),
                                    {
                                        itemId,
                                        quantity,
                                        reason,
                                        cancelledAt: new Date().toISOString(),
                                        cancelId,
                                        status: sub.status === "pending" ? "cancelDirectly" : "cancelled",
                                    },
                                ],
                                cancelStatus: sub.status === "pending" ? "cancelDirectly" : "cancelled",
                            };
                            if (updatedTotalQuantity === 0) {
                                updatedSubOrder.status = sub.status === "pending" ? "cancelDirectly" : "cancelled";
                            }
                            return updatedSubOrder;
                        } else if (
                            response.message === "Cancellation request submitted, awaiting seller approval"
                        ) {
                            return {
                                ...sub,
                                cancelRequests: [
                                    ...(sub.cancelRequests || []),
                                    {
                                        cancelId,
                                        itemId,
                                        quantity,
                                        reason,
                                        status: "Requested",
                                        requestedAt: new Date().toISOString(),
                                    },
                                ],
                                cancelStatus: "Requested",
                            };
                        }
                    }
                    return sub;
                });

                const allSubOrdersCancelled = updatedSubOrders.every(
                    (sub) => sub.status === "cancelled" || sub.status === "cancelDirectly"
                );
                const updatedTotalOrder = {
                    ...prev.totalOrder,
                    status: allSubOrdersCancelled ? "cancelDirectly" : prev.totalOrder.status,
                };

                if (response.updatedTotalOrder) {
                    updatedTotalOrder.totalQuantity = response.updatedTotalOrder.totalQuantity;
                    updatedTotalOrder.totalAmount = response.updatedTotalOrder.totalAmount;
                    updatedTotalOrder.totalPrice = response.updatedTotalOrder.totalPrice;
                    updatedTotalOrder.status = response.updatedTotalOrder.status;
                }

                return {
                    ...prev,
                    totalOrder: updatedTotalOrder,
                    subOrders: updatedSubOrders,
                };
            });

            toast.success(response.message);
            setShowRefundModal(false);
            setSelectedSubOrderId(null);
            setSelectedQuantity(1);
        } catch (error) {
            toast.error(error.message || "Error cancelling order");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestRefund = async ({ reason, files, itemId, quantity, subOrderId }) => {
        try {
            if (!subOrderId) {
                toast.error("Invalid sub-order ID");
                return;
            }
            setLoading(true);
            const subOrder = orderDetails.subOrders.find((sub) => sub.id === subOrderId);
            const item = subOrder.items.find((i) => i.id === itemId);
            
            const originalQuantity = item.originalQuantity || item.quantity;
            const canceledQuantity = (subOrder.cancelledItems || [])
                .filter((c) => c.itemId === itemId)
                .reduce((sum, c) => sum + c.quantity, 0);
            const refundedQuantity = (subOrder.refundItems || [])
                .filter((r) => r.itemId === itemId && r.status !== "Rejected")
                .reduce((sum, r) => sum + r.quantity, 0);
            const availableQuantity = originalQuantity - canceledQuantity - refundedQuantity;
            
            if (quantity > availableQuantity) {
                toast.error(`Cannot refund ${quantity} items. Only ${availableQuantity} available.`);
                return;
            }

            let evidence = [];
            if (files.length > 0) {
                const uploadPromises = files.map((file) => uploadFile(file));
                const uploadResults = await Promise.all(uploadPromises);
                evidence = uploadResults.map((result) => result.fileURL);
            }

            const generatedRefundId = `${subOrderId}-${itemId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            await requestRefund(orderId, subOrderId, {
                reason,
                evidence,
                itemId,
                quantity,
                refundId: generatedRefundId,
            });

            const response = await getOrderById(orderId);
            setOrderDetails({
                totalOrder: {
                    ...response.totalOrder,
                    paidAt: formatDate(response.totalOrder.paidAt),
                    deliveredAt: formatDate(response.totalOrder.deliveredAt),
                    refundStatus: response.totalOrder.refundStatus || "None",
                },
                subOrders: response.subOrders.map((sub) => ({
                    ...sub,
                    refundStatus: sub.refundStatus || "None",
                    cancelStatus: sub.cancelStatus || "None",
                    items: sub.items.map((item) => ({
                        ...item,
                        canceled: item.canceled || item.quantity === 0,
                    })),
                })),
            });

            toast.success("Return & Refund request submitted successfully!");
            setShowRefundModal(false);
            setSelectedSubOrderId(null);
            setSelectedItemId(null);
            setSelectedQuantity(1);
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

    const handleConfirmReturn = async (subOrderId, itemId, quantity, refundId) => {
        try {
            if (!refundId) {
                console.error("Missing refundId in handleConfirmReturn:", { subOrderId, itemId, quantity, refundId });
                toast.error("Invalid refund request. Missing refund ID.");
                return;
            }

            setLoading(true);
            await customerConfirmReturn(orderId, subOrderId, {
                itemId: String(itemId),
                quantity: Number(quantity),
                refundId,
            });
            
            // Refetch order details
            const response = await getOrderById(orderId);
            setOrderDetails({
                totalOrder: {
                    ...response.totalOrder,
                    paidAt: formatDate(response.totalOrder.paidAt),
                    deliveredAt: formatDate(response.totalOrder.deliveredAt),
                    refundStatus: response.totalOrder.refundStatus || "None",
                },
                subOrders: response.subOrders.map((sub) => ({
                    ...sub,
                    refundStatus: sub.refundStatus || "None",
                    cancelStatus: sub.cancelStatus || "None",
                    items: sub.items.map((item) => ({
                        ...item,
                        canceled: item.canceled || item.quantity === 0,
                    })),
                })),
            });

            toast.success("Return confirmed successfully!");
        } catch (error) {
            console.error(`Error in handleConfirmReturn:`, error);
            toast.error("Error confirming return: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSellerConfirmReceipt = async (subOrderId, itemId, quantity, refundId) => {
        try {
            // Add validation for required parameters
            if (!refundId) {
                console.error("Missing refundId in handleSellerConfirmReceipt:", { subOrderId, itemId, quantity, refundId });
                toast.error("Invalid refund request. Missing refund ID.");
                return;
            }

            setLoading(true);
            await processRefund(orderId, subOrderId, {
                action: "approve",
                returnReceived: true,
                itemId,
                quantity,
                refundId,
            });
            
            setOrderDetails((prev) => ({
                ...prev,
                subOrders: prev.subOrders.map((sub) =>
                    sub.id === subOrderId
                        ? {
                            ...sub,
                            items: sub.items
                                .map((i) =>
                                    i.id === itemId
                                        ? { ...i, quantity: i.quantity - quantity }
                                        : i
                                )
                                .filter((i) => i.quantity > 0),
                            refundItems: sub.refundItems.map((r) =>
                                r.itemId === itemId &&
                                r.quantity === quantity &&
                                r.refundId === refundId &&
                                r.status === "Return Confirmed"
                                    ? { ...r, status: "Refunded" }
                                    : r
                            ),
                            totalQuantity: sub.totalQuantity - quantity,
                            totalAmount: sub.items.reduce(
                                (sum, i) => sum + i.price * (i.quantity - (i.id === itemId ? quantity : 0)),
                                0
                            ),
                        }
                        : sub
                ),
            }));
            toast.success("Return receipt confirmed, refund processed!");
        } catch (error) {
            toast.error("Error confirming receipt: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Buy Again
    const handleBuyAgain = (item) => {
        dispatch(
            cartActions.addItemToCart({
                id: item.id,
                category: item.category,
                productName: item.productName,
                price: item.price,
                imgUrl: item.imgUrl,
                quantity: 1,
            })
        );
        toast.success(`${item.productName} đã được thêm vào giỏ hàng!`);
        navigate("/cart");
    };

    const handleAppealRefund = (subOrderId, itemId) => {
        const subOrder = orderDetails.subOrders.find((sub) => sub.id === subOrderId);
        const item = subOrder.items.find((i) => i.id === itemId);
        const rejectedRefund = (subOrder.refundItems || []).find(
            (r) => r.itemId === itemId && r.status === "Rejected"
        );
        
        if (!rejectedRefund) {
            toast.error("Cannot appeal: No rejected refund found for this item");
            return;
        }

        setSelectedSubOrderId(subOrderId);
        setSelectedAppealItem({ 
            ...item, 
            rejectedQuantity: rejectedRefund?.quantity || item.quantity,
            refundId: rejectedRefund.refundId
        });
        setShowAppealModal(true);
    };

    const submitAppeal = async () => {
        if (!appealReason.trim()) {
            toast.error("Please provide a reason for your appeal");
            return;
        }
        if (!selectedAppealItem?.refundId) {
            toast.error("Invalid refund request");
            return;
        }
        try {
            setLoading(true);
            let evidence = [];
            if (appealFiles.length > 0) {
                const uploadPromises = appealFiles.map((file) => uploadFile(file));
                const uploadResults = await Promise.all(uploadPromises);
                evidence = uploadResults.map((result) => result.fileURL);
            }

            const appealData = {
                reason: appealReason,
                evidence,
                itemId: selectedAppealItem.id,
                quantity: selectedAppealItem.rejectedQuantity,
                refundId: selectedAppealItem.refundId,
                itemDetails: {
                    id: selectedAppealItem.id,
                    productName: selectedAppealItem.productName,
                    quantity: selectedAppealItem.rejectedQuantity,
                    price: selectedAppealItem.price,
                    imgUrl: selectedAppealItem.imgUrl,
                }
            };

            await appealRefund(orderId, selectedSubOrderId, appealData);
            setOrderDetails((prev) => ({
                ...prev,
                subOrders: prev.subOrders.map((sub) =>
                    sub.id === selectedSubOrderId
                        ? { ...sub, appealRequested: true }
                        : sub
                ),
            }));
            toast.success("Appeal submitted successfully, awaiting admin review");
            setShowAppealModal(false);
            setAppealReason("");
            setAppealFiles([]);
            setSelectedSubOrderId(null);
            setSelectedAppealItem(null);
        } catch (error) {
            toast.error("Error submitting appeal: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderSubOrderItems = () => {
        return subOrders.map((subOrder) => {
            const subOrderId = subOrder.id;

            return (
                <div key={subOrder.id} className="border rounded p-3 mb-3">
                    <h6 className="seller__store">
                        <i className="fas fa-store me-1"></i>
                        <div className="fw-bold">
                            {sellerNames[subOrder.sellerId] || "Đang tải..."}
                        </div>
                    </h6>
                    {subOrder.items.map((item, index) => {
                        const isCanceled = item.canceled || item.quantity === 0;
                        const refundItems = (subOrder.refundItems || []).filter(
                            (r) => r.itemId === item.id
                        );
                        const originalQuantity = item.originalQuantity || item.quantity;
                        const canceledQuantity = (subOrder.cancelledItems || [])
                            .filter((c) => c.itemId === item.id)
                            .reduce((sum, c) => sum + c.quantity, 0);
                        const refundedQuantity = refundItems
                            .filter((r) => r.status !== "Rejected")
                            .reduce((sum, r) => sum + r.quantity, 0);
                        const pendingCancelQuantity = (subOrder.cancelRequests || [])
                            .filter((c) => c.itemId === item.id && c.status === "Requested")
                            .reduce((sum, c) => sum + c.quantity, 0);
                        const availableQuantity = originalQuantity - canceledQuantity - refundedQuantity - pendingCancelQuantity;

                        const shouldShowCancelBtn =
                            !isSeller &&
                            totalOrder.isPaid &&
                            (subOrder.status === "pending" ||
                                subOrder.status === "processing") &&
                            availableQuantity > 0 &&
                            !isCanceled;

                        const shouldShowRefundBtn =
                            !isSeller &&
                            totalOrder.isPaid &&
                            subOrder.status === "success" &&
                            availableQuantity > 0 &&
                            !isCanceled &&
                            !refundItems.some((r) => r.status === "Return Requested" || r.status === "Return Confirmed");

                        const shouldShowConfirmReturnBtn =
                            !isSeller &&
                            refundItems.some(
                                (r) =>
                                    r.status === "Return Requested" &&
                                    r.itemId === item.id
                            );

                        const shouldShowSellerConfirmBtn =
                            isSeller &&
                            refundItems.some(
                                (r) =>
                                    r.status === "Return Confirmed" &&
                                    r.quantity <= 20
                            );

                        const shouldShowAppealBtn =
                            !isSeller &&
                            refundItems.some((r) => r.status === "Rejected" && r.itemId === item.id) &&
                            !subOrder.appealRequested &&
                            availableQuantity > 0;

                        return (
                            <div
                                key={index}
                                className={`cart__item ${isCanceled ? "canceled__item" : ""}`}
                            >
                                <div className="cart__item-details">
                                    <img
                                        src={item.imgUrl}
                                        alt={item.productName}
                                        className="cart__item-img"
                                    />
                                    <div className="cart__item-info">
                                        <h6>{item.productName}</h6>
                                        <p>
                                            Qty: {item.quantity} | Status:{" "}
                                            {isCanceled
                                                ? "Canceled"
                                                : subOrder.status === "cancelDirectly"
                                                ? "Cancelled Directly"
                                                : subOrder.status || "Pending"}
                                        </p>
                                        {(subOrder.cancelRequests || []).map((c, idx) => (
                                            c.itemId === item.id && (
                                                <p
                                                    key={idx}
                                                    className={
                                                        c.status === "Requested"
                                                            ? "text-warning"
                                                            : c.status === "Approved"
                                                            ? "text-success"
                                                            : "text-danger"
                                                    }
                                                >
                                                    {c.status === "Requested"
                                                        ? `Cancellation request pending for ${c.quantity} item(s)`
                                                        : c.status === "Approved"
                                                        ? `Successfully canceled ${c.quantity} item(s)`
                                                        : `Cancellation request rejected for ${c.quantity} item(s)`}
                                                </p>
                                            )
                                        ))}
                                        {(subOrder.cancelledItems || []).map((c, idx) => (
                                            c.itemId === item.id && (
                                                <p
                                                    key={idx}
                                                    className="text-success"
                                                >
                                                    {c.status === "cancelDirectly"
                                                        ? `Cancelled Directly: ${c.quantity} item(s)`
                                                        : `Cancelled: ${c.quantity} item(s)`}
                                                </p>
                                            )
                                        ))}
                                        {refundItems.map((r, idx) => (
                                            <div key={`${r.refundId}-${idx}`}>
                                                {subOrder.appealRequested && r.status === "Rejected" ? (
                                                    <p className="text-info">
                                                        Appeal submitted, awaiting admin review
                                                    </p>
                                                ) : (
                                                    <>
                                                        {r.status === "Return Requested" && (
                                                            <p className="text-info">
                                                                Awaiting return confirmation (Qty: {r.quantity})
                                                            </p>
                                                        )}
                                                        {r.status === "Return Confirmed" && (
                                                            <p className="text-info">
                                                                Awaiting refund confirmation (Qty: {r.quantity})
                                                            </p>
                                                        )}
                                                        {r.status === "Refunded" && (
                                                            <p className="text-success">
                                                                Refunded successfully (Qty: {r.quantity})
                                                            </p>
                                                        )}
                                                        {r.status === "Rejected" && (
                                                            <p className="text-danger">
                                                                Refund rejected (Qty: {r.quantity})
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {isCanceled && (
                                            <p className="text-success">
                                                This item has been canceled
                                            </p>
                                        )}
                                    </div>
                                    <div className="cart__item-price">
                                        <span className="price__cartItem">
                                            ${item.price * (item.quantity || 1)}
                                        </span>
                                    </div>
                                </div>
                                {(shouldShowCancelBtn ||
                                    shouldShowRefundBtn ||
                                    shouldShowConfirmReturnBtn ||
                                    shouldShowSellerConfirmBtn ||
                                    shouldShowAppealBtn) && (
                                    <div className="suborder__actions">
                                        {(shouldShowCancelBtn ||
                                            shouldShowRefundBtn) && (
                                            <motion.button
                                                whileTap={{ scale: 1.1 }}
                                                className="refund__btn"
                                                onClick={() => {
                                                    setSelectedSubOrderId(subOrderId);
                                                    setSelectedItemId(item.id);
                                                    setSelectedQuantity(Math.min(availableQuantity, item.quantity));
                                                    setShowRefundModal(true);
                                                }}
                                            >
                                                {shouldShowRefundBtn
                                                    ? "Refund Order"
                                                    : "Cancel Order"}
                                            </motion.button>
                                        )}
                                        {shouldShowConfirmReturnBtn && (
                                            <motion.button
                                                whileTap={{ scale: 1.1 }}
                                                className="refund__btn"
                                                onClick={() => {
                                                    setConfirmReturnData({
                                                        subOrderId: subOrder.id,
                                                        itemId: item.id,
                                                        refundItems: refundItems.filter(
                                                            (r) => r.status === "Return Requested"
                                                        ),
                                                    });
                                                    setShowConfirmReturnModal(true);
                                                }}
                                            >
                                                Confirm Return
                                            </motion.button>
                                        )}
                                        {shouldShowSellerConfirmBtn &&
                                            refundItems
                                                .filter((r) => r.status === "Return Confirmed" && r.refundId)
                                                .map((r, idx) => (
                                                    <motion.button
                                                        key={`seller-${r.refundId}-${idx}`}
                                                        whileTap={{ scale: 1.1 }}
                                                        className="refund__btn"
                                                        onClick={() => {
                                                            if (!r.refundId) {
                                                                toast.error("Invalid refund request. Please contact support.");
                                                                return;
                                                            }
                                                            handleSellerConfirmReceipt(
                                                                subOrder.id,
                                                                item.id,
                                                                r.quantity,
                                                                r.refundId
                                                            );
                                                        }}
                                                    >
                                                        Confirm Receipt (Qty: {r.quantity})
                                                    </motion.button>
                                                ))}
                                        {shouldShowAppealBtn && (
                                            <motion.button
                                                whileTap={{ scale: 1.1 }}
                                                className="appeal__btn"
                                                onClick={() => handleAppealRefund(subOrderId, item.id)}
                                            >
                                                Appeal Request
                                            </motion.button>
                                        )}
                                        <motion.button
                                            whileTap={{ scale: 1.1 }}
                                            className="buy-again__btn"
                                            onClick={() => handleBuyAgain(item)}
                                        >
                                            Buy Again
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        });
    };

    const shouldShowProceedToPaymentBtn =
        !isSeller && totalOrder && !totalOrder.isPaid && !showPayment;
    const shouldShowPaypal =
        totalOrder && !totalOrder.isPaid && selectedPaymentMethod === "paypal";
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
                                    setSelectedItemId(null);
                                    setSelectedQuantity(1);
                                }}
                            >
                                {selectedSubOrderId &&
                                    (() => {
                                        const selectedSubOrder = subOrders.find(
                                            (sub) => sub.id === selectedSubOrderId
                                        );
                                        const isSuccess = selectedSubOrder?.status === "success";
                                        const selectedItem = selectedSubOrder?.items.find(
                                            (item) => item.id === selectedItemId
                                        );

                                        return (
                                            <>
                                                {isSuccess ? (
                                                    <RefundRequestForm
                                                        orderId={orderId}
                                                        subOrder={{
                                                            ...selectedSubOrder,
                                                            sellerName: sellerNames[selectedSubOrder.sellerId],
                                                        }}
                                                        item={selectedItem}
                                                        selectedQuantity={selectedQuantity}
                                                        setSelectedQuantity={setSelectedQuantity}
                                                        onRequestRefund={handleRequestRefund}
                                                        onCancel={() => {
                                                            setShowRefundModal(false);
                                                            setSelectedSubOrderId(null);
                                                            setSelectedItemId(null);
                                                            setSelectedQuantity(1);
                                                        }}
                                                        loading={loading}
                                                    />
                                                ) : (
                                                    <CancelOrderForm
                                                        orderId={orderId}
                                                        subOrder={{
                                                            ...selectedSubOrder,
                                                            sellerName: sellerNames[selectedSubOrder.sellerId],
                                                        }}
                                                        item={selectedItem}
                                                        selectedQuantity={selectedQuantity}
                                                        setSelectedQuantity={setSelectedQuantity}
                                                        onCancelOrder={handleCancelOrder}
                                                        onCancel={() => {
                                                            setShowRefundModal(false);
                                                            setSelectedSubOrderId(null);
                                                            setSelectedItemId(null);
                                                            setSelectedQuantity(1);
                                                        }}
                                                        loading={loading}
                                                    />
                                                )}
                                            </>
                                        );
                                    })()}
                            </Modal>

                            <Modal
                                isOpen={showConfirmReturnModal}
                                onClose={() => {
                                    setShowConfirmReturnModal(false);
                                    setConfirmReturnData(null);
                                }}
                            >
                                {confirmReturnData && (
                                    <div className="p-3">
                                        <h5>Confirm Return for {subOrders
                                            .find((sub) => sub.id === confirmReturnData.subOrderId)
                                            ?.items.find((item) => item.id === confirmReturnData.itemId)
                                            ?.productName}</h5>
                                        {confirmReturnData.refundItems.map((refundItem, idx) => {
                                            const item = subOrders
                                                .find((sub) => sub.id === confirmReturnData.subOrderId)
                                                ?.items.find((i) => i.id === refundItem.itemId);
                                            return (
                                                <div key={`${refundItem.refundId}-${idx}`} className="mb-3 p-2 border rounded">
                                                    <img
                                                        src={item?.imgUrl}
                                                        alt={item?.productName}
                                                        className="mb-2"
                                                        style={{ width: "100px", height: "auto" }}
                                                    />
                                                    <p><strong>Name:</strong> {item?.productName || "Unknown"}</p>
                                                    <p><strong>Price:</strong> ${item?.price * refundItem.quantity || 0}</p>
                                                    <p><strong>Quantity to Refund:</strong> {refundItem.quantity}</p>
                                                    <p><strong>Requested on:</strong> {formatDate(refundItem?.returnRequestedAt)}</p>
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        className="refund__btn"
                                                        onClick={() => {
                                                            handleConfirmReturn(
                                                                confirmReturnData.subOrderId,
                                                                confirmReturnData.itemId,
                                                                refundItem.quantity,
                                                                refundItem.refundId
                                                            );
                                                            setShowConfirmReturnModal(false);
                                                            setConfirmReturnData(null);
                                                        }}
                                                        disabled={loading}
                                                    >
                                                        {loading ? "Processing..." : "Confirm Return"}
                                                    </motion.button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Modal>

                            <Modal
                                isOpen={showAppealModal}
                                onClose={() => {
                                    setShowAppealModal(false);
                                    setAppealReason("");
                                    setAppealFiles([]);
                                    setSelectedSubOrderId(null);
                                    setSelectedAppealItem(null);
                                }}
                            >
                                <div className="p-3">
                                    <h5>Appeal Order</h5>
                                    {selectedAppealItem && (
                                        <div className="mb-3">
                                            <img
                                                src={selectedAppealItem.imgUrl}
                                                alt={selectedAppealItem.productName}
                                                style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                            />
                                            <p><strong>Name:</strong> {selectedAppealItem.productName}</p>
                                            <p><strong>Quantity:</strong> {selectedAppealItem.rejectedQuantity}</p>
                                            <p><strong>Price:</strong> ${selectedAppealItem.price * selectedAppealItem.rejectedQuantity}</p>
                                        </div>
                                    )}
                                    <Form>
                                        <textarea
                                            placeholder="Enter your reason for appeal..."
                                            value={appealReason}
                                            onChange={(e) => setAppealReason(e.target.value)}
                                            rows="4"
                                            className="mb-3 w-100"
                                        />
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={(e) => setAppealFiles(Array.from(e.target.files))}
                                            className="mb-3"
                                        />
                                        <motion.button
                                            color="primary"
                                            whileTap={{ scale: 0.95 }}
                                            onClick={submitAppeal}
                                            disabled={loading || !appealReason.trim()}
                                            className="form-btn"
                                        >
                                            {loading ? "Submitting..." : "Submit Appeal"}
                                        </motion.button>
                                    </Form>
                                </div>
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
