import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Form,
    FormGroup,
    Input,
    Label,
    Button,
    Spinner,
} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import "../seller/styles/signupseller.css";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.config";
import { toast } from "react-toastify";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

const SignupSeller = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        email: "",
        password: "",
        confirmPassword: "",
        storeName: "",
        storeDescription: "",
        businessType: "",
        address: "",
        city: "",
        storeEmail: "",
    });

    // Status of using personal email or new email
    const [usePersonalEmail, setUsePersonalEmail] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            setFormData((prevData) => ({
                ...prevData,
                email: user.email,
            }));
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = () => {
        setUsePersonalEmail(!usePersonalEmail);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        // Save data into firestore database
        try {
            const emailToUse = usePersonalEmail
                ? formData.email
                : formData.storeEmail;

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                emailToUse,
                formData.password
            );

            const user = userCredential.user;

            // Lưu thông tin người dùng vào Firestore
            await setDoc(doc(db, "pendingOrders", user.uid), {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                email: formData.email,
                storeName: formData.storeName,
                storeDescription: formData.storeDescription,
                businessType: formData.businessType,
                address: formData.address,
                city: formData.city,
                storeEmail: formData.storeEmail || formData.email,
                status: "pending",
                createdAt: new Date(),
            });

            setLoading(false);
            toast.success(
                "Seller registration successful! Awaiting admin approval."
            );
            navigate("/seller/dashboard");
        } catch (error) {
            toast.error("Failed to submit registration. Please try again.");
        }
    };

    if (loading) {
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

    return (
        <Helmet title="SignUp">
            {loading ? (
                <Container
                    className="d-flex justify-content-center align-items-center"
                    style={{ height: "100vh" }}
                >
                    <Spinner style={{ width: '3rem', height: '3rem' }} />
                    <span className="visually-hidden">Loading...</span>
                </Container>
            ) : (
                <Container className="signup__seller__container">
                    <h2 className="signup__seller__title">
                        Register for a Seller account
                    </h2>
                    <Form onSubmit={handleSubmit} className="signup__seller__form">
                        <Row>
                            <Col md={6}>
                                <h4 className="signup__seller__subtitle">
                                    Personal Information
                                </h4>
                                <FormGroup className="form__group">
                                    <Label for="fullName">Full name</Label>
                                    <Input
                                        type="text"
                                        name="fullName"
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <Label for="phoneNumber">Phone</Label>
                                    <Input
                                        type="tel"
                                        name="phoneNumber"
                                        id="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </FormGroup>
    
                                {/* Only show personal email if checkbox is not selected */}
                                {usePersonalEmail ? (
                                    <FormGroup className="form__group">
                                        <Label for="email">Email</Label>
                                        <Input
                                            type="email"
                                            name="email"
                                            id="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            readOnly={
                                                usePersonalEmail ? true : false
                                            }
                                        />
                                    </FormGroup>
                                ) : (
                                    <FormGroup className="form__group">
                                        <Label for="newEmail">Email</Label>
                                        <Input
                                            type="email"
                                            name="storeEmail"
                                            id="storeEmail"
                                            value={formData.storeEmail}
                                            onChange={handleChange}
                                            required
                                        />
                                    </FormGroup>
                                )}
    
                                <FormGroup check className="custom__checkbox">
                                    <Label check>
                                        <Input
                                            type="checkbox"
                                            checked={!usePersonalEmail}
                                            onChange={handleCheckboxChange}
                                        />
                                        Use a new store email
                                    </Label>
                                </FormGroup>
    
                                <FormGroup className="form__group">
                                    <Label for="password">Password</Label>
                                    <Input
                                        type="password"
                                        name="password"
                                        id="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <Label for="confirmPassword">
                                        Confirm Password
                                    </Label>
                                    <Input
                                        type="password"
                                        name="confirmPassword"
                                        id="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <h4 className="signup__seller__subtitle">
                                    Store Information
                                </h4>
                                <FormGroup className="form__group">
                                    <Label for="storeName">Store name</Label>
                                    <Input
                                        type="text"
                                        name="storeName"
                                        id="storeName"
                                        value={formData.storeName}
                                        onChange={handleChange}
                                        required
                                    />
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <Label for="storeDescription">
                                        Store Description
                                    </Label>
                                    <Input
                                        type="textarea"
                                        name="storeDescription"
                                        id="storeDescription"
                                        value={formData.storeDescription}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <Label for="businessType">Business Type</Label>
                                    <Input
                                        type="select"
                                        name="businessType"
                                        id="businessType"
                                        value={formData.businessType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            Select business type
                                        </option>
                                        <option value="personal">Individual</option>
                                        <option value="business">Business</option>
                                    </Input>
                                </FormGroup>
                                <FormGroup className="form__group__address">
                                    <Label for="address">Address</Label>
                                    <Input
                                        type="text"
                                        name="address"
                                        id="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                    />
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <Label for="city">City</Label>
                                    <Input
                                        type="text"
                                        name="city"
                                        id="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Button
                            color="primary"
                            type="submit"
                            className="signup__seller__submit__btn"
                        >
                            Register
                        </Button>
    
                        <p className="signup__text">
                            Already have an account?
                            <Link to="/seller/login" className="signup__link">
                                Login
                            </Link>
                        </p>
                    </Form>
                </Container>
            )}
        </Helmet>
    );
};

export default SignupSeller;
