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
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import bcrypt from "bcryptjs";

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

    const checkExistingEmail = async (email) => {
        const pendingQuery = query(collection(db, "pendingOrders"), where("email", "==", email));
        const sellersQuery = query(collection(db, "sellers"), where("email", "==", email));

        const [pendingSnapshot, approvedSnapshot] = await Promise.all([
            getDocs(pendingQuery),
            getDocs(sellersQuery)
        ]);

        return !pendingSnapshot.empty || !approvedSnapshot.empty;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            // Check if email already exists
            const emailExists = await checkExistingEmail(formData.email);
            if (emailExists) {
                toast.error("An account with this email already exists or is pending approval.");
                setLoading(false);
                return;
            }

            // Generate a salt and hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(formData.password, salt);

            // Generate a unique ID for the pending order
            const pendingOrderId = doc(collection(db, "pendingOrders")).id;

            // Save data into firestore database
            await setDoc(doc(db, "pendingOrders", pendingOrderId), {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                email: formData.email,
                storeName: formData.storeName,
                storeDescription: formData.storeDescription,
                businessType: formData.businessType,
                address: formData.address,
                city: formData.city,
                storeEmail: formData.storeEmail,
                hashedPassword: hashedPassword, // Store the hashed password
                status: "pending",
                createdAt: new Date(),
            });

            setLoading(false);
            toast.success(
                "Seller registration submitted successfully! Awaiting admin approval."
            );
            navigate("/seller/login");
        } catch (error) {
            toast.error("Failed to submit registration. Please try again.");
            setLoading(false);
        }
    };

    return (
        <Helmet title="SignUp">
            {loading ? (
                <Container
                    className="d-flex justify-content-center align-items-center"
                    style={{ height: "100vh" }}
                >
                    <Spinner style={{ width: "3rem", height: "3rem" }} />
                    <span className="visually-hidden">Loading...</span>
                </Container>
            ) : (
                <Container className="signup__seller__container">
                    <h2 className="signup__seller__title">
                        Register for a Seller account
                    </h2>
                    <Form
                        onSubmit={handleSubmit}
                        className="signup__seller__form"
                    >
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

                                <FormGroup className="form__group">
                                    <Label for="newEmail">Store Email</Label>
                                    <Input
                                        type="email"
                                        name="storeEmail"
                                        id="storeEmail"
                                        value={formData.storeEmail}
                                        onChange={handleChange}
                                        required
                                    />
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
                                    <Label for="businessType">
                                        Business Type
                                    </Label>
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
                                        <option value="personal">
                                            Individual
                                        </option>
                                        <option value="business">
                                            Business
                                        </option>
                                    </Input>
                                </FormGroup>
                                <FormGroup className="form__group">
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
