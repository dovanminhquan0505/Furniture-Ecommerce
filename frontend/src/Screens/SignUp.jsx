import React, { useState } from "react";
import "../styles/signup.css";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup, Spinner } from "reactstrap";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { userActions } from "../redux/slices/userSlice";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.config";
import { registerUser, uploadFile } from "../api";

const Signup = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const register = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Check email
        if (!email.includes("@")) {
            toast.error("Please enter a valid email address");
            setLoading(false);
            return;
        }

        // Check password has at least 6 characters
        if (password.length < 6) {
            toast.error("Password should be at least 6 characters");
            setLoading(false);
            return;
        }

        // Check if the file has not already been loaded
        if (!file) {
            toast.error("Please select a file to upload");
            setLoading(false);
            return;
        }

        try {
            const uploadResponse = await uploadFile(file);
            const fileURL = uploadResponse.fileURL;

            // Gửi thông tin đăng ký lên backend
            const registerResponse = await registerUser({
                username,
                email,
                password,
                fileURL,
            });

            // Đăng nhập bằng Firebase để đồng bộ trạng thái
            await signInWithEmailAndPassword(auth, email, password);

            dispatch(userActions.setUser(registerResponse.user));
            setLoading(false);
            toast.success("Account created successfully!");
            navigate("/checkout");
        } catch (error) {
            setLoading(false);
            toast.error(error.message || "Something went wrong!");
        }
    };

    return (
        <Helmet title=" Register">
            <section className="signup-section">
                <Container>
                    <Row>
                        {loading ? (
                            <Container
                                className="d-flex justify-content-center align-items-center"
                                style={{ height: "100vh" }}
                            >
                                <Spinner
                                    style={{ width: "3rem", height: "3rem" }}
                                />
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </Container>
                        ) : (
                            <Col
                                lg="6"
                                className="m-auto text-center signup-col"
                            >
                                <h3 className="signup__title">Register</h3>
                                <Form
                                    className="signup__form"
                                    onSubmit={register}
                                >
                                    <FormGroup className="signup__formGroup">
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) =>
                                                setUsername(e.target.value)
                                            }
                                            className="signup__input"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup className="signup__formGroup">
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            className="signup__input"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup className="signup__formGroup">
                                        <input
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            className="signup__input"
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup className="signup__formGroup">
                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                setFile(e.target.files[0])
                                            }
                                            className="signup__input"
                                            required
                                        />
                                    </FormGroup>

                                    <motion.button
                                        whileTap={{ scale: 1.2 }}
                                        type="submit"
                                        className="signup__btn"
                                    >
                                        Sign Up
                                    </motion.button>

                                    <p className="signup__text">
                                        Already have an account?
                                        <Link
                                            to="/login"
                                            className="signup__link"
                                        >
                                            Login
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

export default Signup;
