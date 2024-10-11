import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Spinner,
} from "reactstrap";
import { Store, Mail, Phone, MapPin, Building, Briefcase } from "lucide-react";
import { useForm } from "react-hook-form";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase.config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../seller/styles/store-information.css";
import Helmet from "../components/Helmet/Helmet";

const StoreInformation = ({ sellerData }) => {
    const [loading, setLoading] = useState(true);
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm();
    const navigate = useNavigate();
    const [sellerId, setSellerId] = useState(null);

    useEffect(() => {
        const fetchSellerData = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("You must be logged in to view your products");
                navigate("/login");
                return;
            }

            const userDocRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setSellerId(userData.sellerId);
            } else {
                toast.error("User not found");
                navigate("/register");
            }
        };

        fetchSellerData();
    }, [navigate, setSellerId]);

    useEffect(() => {
        const fetchSellerData = async () => {
            if (!sellerId) return;

            try {
                const sellerRef = doc(db, "sellers", sellerId);
                const sellerSnap = await getDoc(sellerRef);

                if (sellerSnap.exists()) {
                    const data = sellerSnap.data();

                    setValue("storeName", data.storeName || "");
                    setValue("storeDescription", data.storeDescription || "");
                    setValue("storeEmail", data.storeEmail || "");
                    setValue("phoneNumber", data.phoneNumber || "");
                    setValue("address", data.address || "");
                    setValue("city", data.city || "");
                    setValue("businessType", data.businessType || "");
                } else {
                    console.log("Store Information not found!");
                    toast.error("Store Information not found!");
                }
            } catch (error) {
                toast.error("Failed to fetch data:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSellerData();
    }, [sellerId, setValue]);

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
        } catch (error) {}
    };

    if (loading) {
        return (
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
                <span className="visually-hidden">Loading...</span>
            </Container>
        );
    }

    return (
        <Helmet title=" Store Information">
            <Container className="store-information mt-4">
                <h2 className="store-information__title mb-4">
                    Store Information
                </h2>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row>
                        <Col md={6}>
                            <FormGroup className="store-information__form-group">
                                <Label
                                    for="storeName"
                                    className="store-information__label d-flex align-items-center"
                                >
                                    <Store
                                        className="store-information__icon me-2"
                                        size={18}
                                    />
                                    Store Name:
                                </Label>
                                <Input
                                    id="storeName"
                                    className="store-information__input"
                                    {...register("storeName", {
                                        required: "Store Name is required",
                                    })}
                                    invalid={!!errors.storeName}
                                />
                                {errors.storeName && (
                                    <span className="store-information__error">
                                        {errors.storeName.message}
                                    </span>
                                )}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup className="store-information__form-group">
                                <Label
                                    for="storeEmail"
                                    className="store-information__label d-flex align-items-center"
                                >
                                    <Mail
                                        className="store-information__icon me-2"
                                        size={18}
                                    />
                                    Store Email
                                </Label>
                                <Input
                                    id="storeEmail"
                                    type="email"
                                    className="store-information__input"
                                    {...register("storeEmail", {
                                        required: "Store email is required",
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Store email is invalid",
                                        },
                                    })}
                                    invalid={!!errors.storeEmail}
                                />
                                {errors.storeEmail && (
                                    <span className="store-information__error">
                                        {errors.storeEmail.message}
                                    </span>
                                )}
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <FormGroup className="store-information__form-group">
                                <Label
                                    for="phoneNumber"
                                    className="store-information__label d-flex align-items-center"
                                >
                                    <Phone
                                        className="store-information__icon me-2"
                                        size={18}
                                    />
                                    Phone Number:
                                </Label>
                                <Input
                                    id="phoneNumber"
                                    type="tel"
                                    className="store-information__input"
                                    {...register("phoneNumber", {
                                        required: "Phone Number is required",
                                        pattern: {
                                            value: /^[0-9]{10}$/,
                                            message: "Phone Number is invalid",
                                        },
                                    })}
                                    invalid={!!errors.phoneNumber}
                                />
                                {errors.phoneNumber && (
                                    <span className="store-information__error">
                                        {errors.phoneNumber.message}
                                    </span>
                                )}
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup className="store-information__form-group">
                                <Label
                                    for="address"
                                    className="store-information__label d-flex align-items-center"
                                >
                                    <MapPin
                                        className="store-information__icon me-2"
                                        size={18}
                                    />
                                    Address:
                                </Label>
                                <Input
                                    id="address"
                                    className="store-information__input"
                                    {...register("address")}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <FormGroup className="store-information__form-group">
                                <Label
                                    for="city"
                                    className="store-information__label d-flex align-items-center"
                                >
                                    <Building
                                        className="store-information__icon me-2"
                                        size={18}
                                    />
                                    City:
                                </Label>
                                <Input
                                    id="city"
                                    className="store-information__input"
                                    {...register("city")}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup className="store-information__form-group">
                                <Label
                                    for="businessType"
                                    className="store-information__label d-flex align-items-center"
                                >
                                    <Briefcase
                                        className="store-information__icon me-2"
                                        size={18}
                                    />
                                    Business Types:
                                </Label>
                                <Input
                                    id="businessType"
                                    type="select"
                                    className="store-information__input"
                                    {...register("businessType")}
                                >
                                    <option value="">
                                        Choose Business Type
                                    </option>
                                    <option value="individual">
                                        Individual
                                    </option>
                                    <option value="business">Business</option>
                                </Input>
                            </FormGroup>
                        </Col>
                    </Row>

                    <FormGroup className="store-information__form-group">
                        <Label
                            for="storeDescription"
                            className="store-information__label d-flex align-items-center"
                        >
                            <Store
                                className="store-information__icon me-2"
                                size={18}
                            />
                            Store Description:
                        </Label>
                        <Input
                            id="storeDescription"
                            className="store-information__textarea"
                            type="textarea"
                            rows="3"
                            {...register("storeDescription")}
                        />
                    </FormGroup>

                    <div className="store-information__submit-container">
                        <Button
                            color="primary"
                            type="submit"
                            className="store-information__submit-btn"
                        >
                            Edit Changes
                        </Button>
                    </div>
                </Form>
            </Container>
        </Helmet>
    );
};

export default StoreInformation;
