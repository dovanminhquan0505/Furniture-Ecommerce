import React, { useEffect, useState } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, FormGroup, Form } from "reactstrap";
import { motion } from "framer-motion";
import CommonSection from "../components/UI/CommonSection";
import "../styles/checkout.css";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useAuth from "../custom-hooks/useAuth";
import { toast } from "react-toastify";
import { createOrder, getUserProfileById } from "../api";

const Checkout = () => {
    const { currentUser } = useAuth();
    const cart = useSelector((state) => state.cart);
    const [orderData, setOrderData] = useState(null);
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

    useEffect(() => {
        if (cart) {
            setOrderData({
                totalQty: cart.totalQuantity || 0,
                totalAmount: cart.totalAmount || 0,
                totalShipping: cart.totalShipping || 0,
                totalTax: cart.totalTax || 0,
                totalPrice: cart.totalPrice || 0,
                cartItems: cart.cartItems || [],
            });
        }

        const fetchUserProfile = async () => {
            if (currentUser) {
                try {
                    const userData = await getUserProfileById(currentUser.uid);
                    setBillingInfo({
                        name: userData.displayName || "",
                        email: userData.email || "",
                        phone: userData.phone || "",
                        address: userData.address || "",
                        city: "", 
                        postalCode: "",
                        country: "", 
                    });
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    toast.error("Failed to load user profile: " + error.message);
                }
            }
        };

        fetchUserProfile();
    }, [cart, currentUser]);

    // Handle when user get values into input fields
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBillingInfo((prev) => ({
            ...prev,
            [name]: name === "phone" ? value : value,
        }));
    };

    // Update state when user enters information
    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            navigate("/login");
            return;
        }

        if (
            !billingInfo.name ||
            !billingInfo.email ||
            !billingInfo.phone ||
            !billingInfo.address ||
            !billingInfo.city ||
            !billingInfo.postalCode ||
            !billingInfo.country
        ) {
            toast.error("Please fill in all billing information");
            return;
        }

        if (
            !orderData ||
            !Array.isArray(orderData.cartItems) ||
            orderData.cartItems.length === 0
        ) {
            toast.error("Your cart is empty");
            return;
        }

        const totalQuantity = orderData.totalQty || 0;
        const totalAmount = orderData.totalAmount || 0;

        // Dữ liệu gửi lên API
        const totalOrdersData = {
            userId: currentUser.uid,
            billingInfo: {
                name: billingInfo.name,
                email: billingInfo.email,
                phone: billingInfo.phone,
                address: billingInfo.address,
                city: billingInfo.city,
                postalCode: billingInfo.postalCode,
                country: billingInfo.country,
            },
            items: orderData.cartItems.map((item) => ({
                id: item.id,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
                imgUrl: item.imgUrl,
                category: item.category || "Unknown",
                sellerId: item.sellerId || "Unknown",
            })),
            totalQuantity: totalQuantity,
            totalAmount: totalAmount,
            totalShipping: orderData.totalShipping,
            totalTax: orderData.totalTax,
            totalPrice: orderData.totalPrice,
            isPaid: false,
            isDelivered: false,
            createdAt: new Date().toISOString(),
            sellerIds: [
                ...new Set(
                    orderData.cartItems.map(
                        (item) => item.sellerId || "Unknown"
                    )
                ),
            ],
        };

        console.log("Sending totalOrdersData:", totalOrdersData); 
        console.log("Cart items:", orderData.cartItems);

        try {
            const response = await createOrder(totalOrdersData);
            const orderId = response.id;

            navigate(`/placeorder/${orderId}`, {
                state: { billingInfo, orderId },
            });
        } catch (error) {
            console.error(error);
            toast.error("Error creating order: " + (error.message || error));
        }
    };

    return (
        <Helmet title=" Checkout">
            <CommonSection title="Checkout" />

            <section>
                <Container>
                    <Row>
                        {/* Billing Information */}
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

                        {/* Order details */}
                        <Col lg="4">
                            <div className="checkout__cart">
                                <h6>
                                    Total Qty:
                                    <span>
                                        {orderData ? orderData.totalQty : 0}
                                        {orderData && orderData.totalQty <= 1
                                            ? " item"
                                            : " items"}
                                    </span>
                                </h6>
                                <h6>
                                    Subtotal:{" "}
                                    <span>
                                        ${orderData ? orderData.totalAmount : 0}
                                    </span>
                                </h6>
                                <h6>
                                    <span>Shipping:</span>
                                    <span>
                                        $
                                        {orderData
                                            ? orderData.totalShipping
                                            : 0}
                                    </span>
                                </h6>
                                <h6>
                                    Tax:{" "}
                                    <span>
                                        ${orderData ? orderData.totalTax : 0}{" "}
                                    </span>
                                </h6>
                                <h4>
                                    Total Cost:{" "}
                                    <span>
                                        ${orderData ? orderData.totalPrice : 0}
                                    </span>
                                </h4>

                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 1.1 }}
                                    className="buy__btn auth__btn w-100"
                                    onClick={handlePlaceOrder}
                                >
                                    Continue
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
