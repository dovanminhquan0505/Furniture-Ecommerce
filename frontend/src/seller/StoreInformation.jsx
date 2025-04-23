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
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../seller/styles/store-information.css";
import Helmet from "../components/Helmet/Helmet";
import { fetchSellerInfo, getUserById, updateSellerInfo } from "../api";

const StoreInformation = () => {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();
    const [sellerId, setSellerId] = useState(null);
    const [storeInfo, setStoreInfo] = useState({
        storeName: "",
        storeEmail: "",
        phoneNumber: "",
        address: "",
        city: "",
        businessType: "",
        storeDescription: "",
    });

    const [originalStoreInfo, setOriginalStoreInfo] = useState({
        ...storeInfo,
    });

    // Get sellerId for user
    useEffect(() => {
        const fetchSellerId = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("You must be logged in");
                navigate("/login");
                return;
            }
            try {
                const userData = await getUserById(currentUser.uid);
                setSellerId(userData.sellerId);
            } catch (error) {
                toast.error("Failed to fetch seller ID: " + error.message);
                navigate("/login");
            }
        };

        fetchSellerId();
    }, [navigate]);

    useEffect(() => {
        const fetchSellerData = async () => {
            if (!sellerId) return;
            setLoading(true);
            try {
                const data = await fetchSellerInfo(sellerId);
                setStoreInfo(data);
                setOriginalStoreInfo(data);
            } catch (error) {
                toast.error("Failed to fetch data: " + error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSellerData();
    }, [sellerId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setStoreInfo((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Check changes
        if (JSON.stringify(storeInfo) === JSON.stringify(originalStoreInfo)) {
            toast.info("No changes made to update.");
            setLoading(false);
            return;
        }

        try {
            await updateSellerInfo(sellerId, storeInfo);
            setIsEditing(false);
            setOriginalStoreInfo(storeInfo);
            toast.success("Store information updated successfully");
        } catch (error) {
            toast.error("Failed to update data: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (e) => {
        e.preventDefault();
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setStoreInfo(originalStoreInfo);
    };

    const renderField = (label, value, icon) => (
        <FormGroup className="store-information__form-group">
            <Label className="store-information__label d-flex align-items-center">
                {icon}
                {label}:
            </Label>
            <div className="store-information__value">
                {value || "Not provided"}
            </div>
        </FormGroup>
    );

    const renderEditField = (name, label, icon, type = "text") => (
        <FormGroup className="store-information__form-group">
            <Label
                for={name}
                className="store-information__label d-flex align-items-center"
            >
                {icon}
                {label}:
            </Label>
            <Input
                id={name}
                type={type}
                className="store-information__input"
                name={name}
                value={storeInfo[name]}
                onChange={handleInputChange}
            />
        </FormGroup>
    );

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
        <Helmet title="Store Information">
            <Container className="store-information mt-4">
                <h2 className="store-information__title mb-4">
                    Store Information
                </h2>
                <Form onSubmit={onSubmit}>
                    <Row>
                        <Col md={6}>
                            {isEditing
                                ? renderEditField(
                                      "storeName",
                                      "Store Name",
                                      <Store
                                          className="store-information__icon me-2"
                                          size={18}
                                      />
                                  )
                                : renderField(
                                      "Store Name",
                                      storeInfo.storeName,
                                      <Store
                                          className="store-information__icon me-2"
                                          size={18}
                                      />
                                  )}
                        </Col>
                        <Col md={6}>
                            {isEditing
                                ? renderEditField(
                                      "storeEmail",
                                      "Store Email",
                                      <Mail
                                          className="store-information__icon me-2"
                                          size={18}
                                      />,
                                      "email"
                                  )
                                : renderField(
                                      "Store Email",
                                      storeInfo.storeEmail,
                                      <Mail
                                          className="store-information__icon me-2"
                                          size={18}
                                      />
                                  )}
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            {isEditing
                                ? renderEditField(
                                      "phoneNumber",
                                      "Phone Number",
                                      <Phone
                                          className="store-information__icon me-2"
                                          size={18}
                                      />,
                                      "tel"
                                  )
                                : renderField(
                                      "Phone Number",
                                      storeInfo.phoneNumber,
                                      <Phone
                                          className="store-information__icon me-2"
                                          size={18}
                                      />
                                  )}
                        </Col>
                        <Col md={6}>
                            {isEditing
                                ? renderEditField(
                                      "address",
                                      "Address",
                                      <MapPin
                                          className="store-information__icon me-2"
                                          size={18}
                                      />
                                  )
                                : renderField(
                                      "Address",
                                      storeInfo.address,
                                      <MapPin
                                          className="store-information__icon me-2"
                                          size={18}
                                      />
                                  )}
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            {isEditing
                                ? renderEditField(
                                      "city",
                                      "City",
                                      <Building
                                          className="store-information__icon me-2"
                                          size={18}
                                      />
                                  )
                                : renderField(
                                      "City",
                                      storeInfo.city,
                                      <Building
                                          className="store-information__icon me-2"
                                          size={18}
                                      />
                                  )}
                        </Col>
                        <Col md={6}>
                            {isEditing ? (
                                <FormGroup className="store-information__form-group">
                                    <Label
                                        for="businessType"
                                        className="store-information__label d-flex align-items-center"
                                    >
                                        <Briefcase
                                            className="store-information__icon me-2"
                                            size={18}
                                        />
                                        Business Type:
                                    </Label>
                                    <Input
                                        id="businessType"
                                        type="select"
                                        className="store-information__input"
                                        name="businessType"
                                        value={storeInfo.businessType}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">
                                            Choose Business Type
                                        </option>
                                        <option value="personal">
                                            Individual
                                        </option>
                                        <option value="business">
                                            Business
                                        </option>
                                    </Input>
                                </FormGroup>
                            ) : (
                                renderField(
                                    "Business Type",
                                    storeInfo.businessType,
                                    <Briefcase
                                        className="store-information__icon me-2"
                                        size={18}
                                    />
                                )
                            )}
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            {isEditing
                                ? renderEditField(
                                      "storeDescription",
                                      "Store Description",
                                      null,
                                      "textarea"
                                  )
                                : renderField(
                                      "Store Description",
                                      storeInfo.storeDescription,
                                      null
                                  )}
                        </Col>
                    </Row>

                    <div className="store-information__button-group">
                        {isEditing ? (
                            <>
                                <Button color="success" type="submit">
                                    Update
                                </Button>
                                <Button
                                    color="secondary"
                                    onClick={handleCancel}
                                    className="ms-2"
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="button"
                                color="primary"
                                onClick={handleEdit}
                            >
                                Edit
                            </Button>
                        )}
                    </div>
                </Form>
            </Container>
        </Helmet>
    );
};

export default StoreInformation;
