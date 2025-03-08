import React, { useState } from "react";
import "../styles/login.css";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup, Spinner } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import logoGoogle from "../assets/images/logoGoogle.jpg";
import axios from "axios";
import { useDispatch } from "react-redux";
import { userActions } from "../redux/slices/userSlice";
import { GoogleAuthProvider, signInWithCustomToken, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase.config";
import { googleLogin } from "../api";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const signIn = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!email) {
            toast.error("Please enter your email");
            setLoading(false);
            return;
        }

        if (!password) {
            toast.error("Please enter your password");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                { email, password }
            );
            const { token: customToken, refreshToken, user } = response.data;

            // Đăng nhập vào Firebase với custom token
            const userCredential = await signInWithCustomToken(
                auth,
                customToken
            );
            const idToken = await userCredential.user.getIdToken();

            // Lưu thông tin vào localStorage
            localStorage.setItem("accessToken", idToken);
            localStorage.setItem("authToken", idToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));

            dispatch(userActions.setUser(user));

            setLoading(false);
            toast.success("Successfully logged in!");

            if (user.role === "admin") {
                console.log("Navigating to admin dashboard");
                navigate("/admin/dashboard");
            } else {
                navigate("/checkout");
            }
        } catch (error) {
            setLoading(false);
            console.error("Login error:", error);
            const errorMessage =
                error.response?.data?.error || error.message || "Login failed!";
            toast.error(errorMessage);
        }
    };

    // Sign In for Google account.
    const signInWithGoogle = async () => {
        setLoading(true);
        try {
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          const idToken = await result.user.getIdToken();
      
          // Gửi idToken lên backend qua googleLogin
          const response = await googleLogin(idToken);
          const { token, refreshToken, user } = response;
      
          // Lưu thông tin vào localStorage
          localStorage.setItem("accessToken", idToken);
          localStorage.setItem("authToken", idToken);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", JSON.stringify(user));
      
          dispatch(userActions.setUser(user));
      
          setLoading(false);
          toast.success("Successfully logged in with Google!");
          navigate("/checkout");
        } catch (error) {
          setLoading(false);
          console.error("Google login error:", error);
          toast.error(error.message || "Failed to login with Google!");
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
        <Helmet title=" Login">
            <section className="login-section">
                <Container>
                    <Row>
                        {loading ? (
                            <Container
                                className="d-flex justify-content-center align-items-center"
                                style={{ height: "100vh" }}
                            >
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">
                                        Loading...
                                    </span>
                                </Spinner>
                            </Container>
                        ) : (
                            <Col
                                lg="6"
                                className="m-auto text-center login-col"
                            >
                                <h3 className="login-title">Login</h3>
                                <Form className="login-form" onSubmit={signIn}>
                                    <FormGroup className="login-form-group">
                                        <input
                                            type="email"
                                            className="login-input"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                        />
                                    </FormGroup>
                                    <FormGroup className="login-form-group">
                                        <input
                                            type="password"
                                            className="login-input"
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
                                        className="login-btn"
                                    >
                                        Login
                                    </motion.button>

                                    <div className="login__section">
                                        Or Login With
                                    </div>

                                    {/* Google Sign In button */}
                                    <motion.button
                                        whileTap={{ scale: 1.1 }}
                                        type="button"
                                        className="google-login-btn"
                                        onClick={signInWithGoogle}
                                    >
                                        <img
                                            src={logoGoogle}
                                            alt="Google Logo"
                                            className="google-logo"
                                        />
                                        <span>Sign in with Google</span>
                                    </motion.button>

                                    <p className="login-text">
                                        Don't have an account?
                                        <Link
                                            to="/signup"
                                            className="login-link"
                                        >
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
