import React, { useState } from "react";
import "../styles/login.css";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const signIn = async (e) => {
        e.preventDefault();
        setLoading(true);

        if(!email) {
            toast.error("Please enter your email");
            setLoading(false);
            return;
        }

        if(!password) {
            toast.error("Please enter your password");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            console.log(user);
            setLoading(false);
            toast.success("Successfully logged in!");
            navigate("/checkout");
        } catch (error) {
            setLoading(false);
            // Check types of error
            switch (error.code) {
                case 'auth/wrong-password':
                    toast.error('Wrong Password!');
                    break;
                case 'auth/user-not-found':
                    toast.error('Account not found!');
                    break;
                case 'auth/invalid-email':
                    toast.error('Invalid Email!');
                    break;
                case 'auth/invalid-credential':
                    toast.error('Invalid Login Information!');
                    break;
                default:
                    toast.error(error.message);  // Thông báo lỗi chung
            }
        }
    };

    return (
        <Helmet title=" Login">
            <section>
                <Container>
                    <Row>
                        {loading ? (
                            <Col lg="12" className="text-center">
                                <h5 className="fw-bold">Loading...</h5>
                            </Col>
                        ) : (
                            <Col lg="6" className="m-auto text-center">
                                <h3 className="fw-bold mb-4">Login</h3>

                                <Form className="auth__form" onSubmit={signIn}>
                                    <FormGroup className="form__group">
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                        />
                                    </FormGroup>

                                    <FormGroup className="form__group">
                                        <input
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                        />
                                    </FormGroup>

                                    <motion.button
                                        whileTap={{ scale: 1.2 }}
                                        type="submit"
                                        className="buy__btn auth__btn mb-3"
                                    >
                                        Login
                                    </motion.button>

                                    <p>
                                        Don't have any accounts?{" "}
                                        <Link to="/signup">
                                            Create an account
                                        </Link>
                                    </p>
                                </Form>
                            </Col>
                        )}
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Login;
