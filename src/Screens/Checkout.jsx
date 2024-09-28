import React, { useState } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, FormGroup, Form } from "reactstrap";
import { motion } from "framer-motion";
import CommonSection from "../components/UI/CommonSection";
import "../styles/checkout.css";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useAuth from "../custom-hooks/useAuth";
import { toast } from "react-toastify";
import { collection, setDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase.config";

const Checkout = () => {
    const { currentUser } = useAuth();
    const totalQty = useSelector((state) => state.cart.totalQuantity);
    const totalAmount = useSelector((state) => state.cart.totalAmount);
    const totalShipping = useSelector((state) => state.cart.totalShipping);
    const totalTax = useSelector((state) => state.cart.totalTax);
    const totalPrice = useSelector((state) => state.cart.totalPrice);
    const cartItems = useSelector((state) => state.cart.cartItems);
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

    // Handle when user get values into input fields
    const handleInputChange = (e) => {
        // Name is the name attribute of the input tag, value is the value attribute
        const { name, value } = e.target;
        // Update the state with the new value
        setBillingInfo((prev) => ({
            ...prev,
            [name]: name === "phone" ? value : value,
        }));
    };

    // Update state when user enters information
    const handlePlaceOrder = async (e) => {
        e.preventDefault();
    
        if (!currentUser) {
            // Redirect to login if user is not logged in
            navigate("/login");
            return;
        }
    
        // Create order data
        const orderData = {
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
            cartItems: cartItems,
            totalAmount: totalAmount,
            totalShipping: totalShipping,
            totalTax: totalTax,
            totalPrice: totalPrice,
            isPaid: false,
            isDelivered: false,
            createdAt: new Date(),
        };
    
        try {
            // Create order and get the orderId
            const orderRef = await addDoc(collection(db, "orders"), orderData);
            const orderId = orderRef.id;
    
            // If order created successfully, navigate to place order details
            navigate("/placeorder", { state: { billingInfo, orderId } });
        } catch (error) {
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
                                    Total Qty:{" "}
                                    <span>
                                        {Math.abs(totalQty)}{" "}
                                        {Math.abs(totalQty) <= 1
                                            ? "item"
                                            : "items"}
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
                                    onClick={handlePlaceOrder}
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
