import React, { useEffect, useRef, useState } from "react";
import "../styles/login.css";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup, Spinner } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import logoGoogle from "../assets/images/logoGoogle.jpg";
import { useDispatch, useSelector } from "react-redux";
import { userActions } from "../redux/slices/userSlice";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase.config";
import { getUserById, googleLogin, loginUser } from "../api";
import ReCAPTCHA from "react-google-recaptcha";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const [captchaError, setCaptchaError] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const reduxUser = useSelector((state) => state.user.currentUser);
    const recaptchaRef = useRef(null);

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

        if(!captchaToken) {
            toast.error("Please check captcha")
            setLoading(false);
            return;
        }

        try {
            toast.info("Authenticating, please wait...", { autoClose: false, toastId: 'auth-process' });
            const response = await loginUser({ email, password, captchaToken });
            toast.dismiss('auth-process');
            await signInWithEmailAndPassword(auth, email, password);
            dispatch(userActions.setUser(response.user));
            setLoading(false);
            toast.success("Successfully logged in!");
            if (recaptchaRef.current) { 
                recaptchaRef.current.reset();
            }
            setCaptchaToken(null);
        } catch (error) {
            setLoading(false);
            toast.error(error.message || "Login failed!");
            if (recaptchaRef.current) { 
                recaptchaRef.current.reset();
            }
            setCaptchaToken(null);
        }
    };

    // Sign In for Google account.
    const signInWithGoogle = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            await googleLogin(idToken);

            const user = result.user;
            const fullUserData = await getUserById(user.uid);
            const updatedUserData = {
                uid: user.uid,
                email: user.email,
                displayName: fullUserData.username || user.displayName,
                photoURL: fullUserData.photoURL || user.photoURL,
                role: fullUserData.role || "user",
                sellerId: fullUserData.sellerId || null,
            };

            dispatch(userActions.setUser(updatedUserData));
            toast.success("Successfully logged in with Google!");
        } catch (error) {
            console.error("Error during signInWithPopup:", error);
            toast.error(error.message || "Failed to login with Google!");
        } finally {
            setLoading(false);
        }
    };

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token);
        setCaptchaError(false);
    };
    
    const handleCaptchaError = () => {
        setCaptchaError(true);
        setCaptchaToken(null);
        toast.error("CAPTCHA verification failed. Please try again.");
    };
    
    const handleCaptchaExpired = () => {
        setCaptchaToken(null);
        if (recaptchaRef.current) {
            recaptchaRef.current.reset();
        }
    };
    
    useEffect(() => {
        if (reduxUser) {
            if (reduxUser.role === "admin") {
                navigate("/admin/dashboard");
            } else if (reduxUser.sellerId) {
                navigate("/seller/dashboard");
            } else {
                navigate("/home");
            }
        }
    }, [reduxUser, navigate]);
    
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
                                    {/* Thêm reCAPTCHA */}
                                    <FormGroup className="login-form-group">
                                        <ReCAPTCHA
                                            ref={recaptchaRef}
                                            sitekey={process.env.REACT_APP_SITE_KEY_RECAPTCHA}
                                            onChange={handleCaptchaChange}
                                            onError={handleCaptchaError}
                                            onExpired={handleCaptchaExpired}
                                        />
                                        {captchaError && (
                                            <div className="text-danger mt-2">
                                                CAPTCHA verification failed. Please try again.
                                            </div>
                                        )}
                                    </FormGroup>
                                    <motion.button
                                        whileTap={{ scale: 1.2 }}
                                        type="submit"
                                        className="login-btn"
                                        disabled={loading || !captchaToken}
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
