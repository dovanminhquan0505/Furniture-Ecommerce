import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup, Input } from "reactstrap";
import "../seller/styles/loginseller.css";
import Helmet from "../components/Helmet/Helmet";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const LoginSeller = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        
        console.log("Login attempt with:", email, password);
    };

    return (
        <Helmet title="Login">
            <section className="login__seller-section">
                <Container>
                    <Row>
                        <Col lg="6" className="m-auto text-center login__col">
                            <h3 className="login__seller__title mb-4">
                                Login Seller Account
                            </h3>
                            <Form
                                className="login__seller__form"
                                onSubmit={handleSubmit}
                            >
                                <FormGroup className="login__seller__form__group">
                                    <Input
                                        type="email"
                                        placeholder="Your Seller Email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className="login__seller__form__input"
                                        required
                                    />
                                </FormGroup>
                                <FormGroup className="login__seller__form__group">
                                    <Input
                                        type="password"
                                        placeholder="Your Seller Password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className="login__seller__form__input"
                                        required
                                    />
                                </FormGroup>
                                <motion.button
                                    whileTap={{ scale: 1.1 }}
                                    type="submit"
                                    className="login__seller__form__btn"
                                >
                                    Login
                                </motion.button>

                                <div className="login__seller__section">
                                    Or Login With
                                </div>

                                <p className="login__seller__text">
                                    Don't have an account?
                                    <Link
                                        to="/seller/signup"
                                        className="login__seller__link"
                                    >
                                        Create an account
                                    </Link>
                                </p>
                            </Form>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default LoginSeller;
