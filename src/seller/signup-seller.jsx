import React, { useState } from "react";
import {
    Container,
    Row,
    Col,
    Form,
    FormGroup,
    Input,
    Label,
    Button,
} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import "../seller/styles/signupseller.css";
import { Link } from "react-router-dom";

const SignupSeller = () => {
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
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log("Form submitted:", formData);
    };

    return (
        <Helmet title=" SignUp">
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
                            <FormGroup className="form__group">
                                <Label for="email">Email</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={formData.email}
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
                        Sign Up
                    </Button>

                    <p className="signup__text">
                        Already have an account?
                        <Link to="/seller/login" className="signup__link">
                            Login
                        </Link>
                    </p>
                </Form>
            </Container>
        </Helmet>
    );
};

export default SignupSeller;
