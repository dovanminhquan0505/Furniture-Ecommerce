import React, { useState } from "react";
import "../styles/login.css";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup, Spinner } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, db, googleProvider } from "../firebase.config";
import { toast } from "react-toastify";
import logoGoogle from "../assets/images/logoGoogle.jpg";
import { doc, setDoc } from "firebase/firestore";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
                case "auth/wrong-password":
                    toast.error("Wrong Password!");
                    break;
                case "auth/user-not-found":
                    toast.error("Account not found!");
                    break;
                case "auth/invalid-email":
                    toast.error("Invalid Email!");
                    break;
                case "auth/invalid-credential":
                    toast.error("Invalid Login Information!");
                    break;
                default:
                    toast.error(error.message); // General error message
            }
        }
    };

    // Sign In for Google account.
    const signInWithGoogle = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            console.log(user);
            setLoading(false);
            toast.success("Successfully logged in with Google!");

            // Add user information to Firestore account
            await addUserToFireStore(user);

            navigate("/checkout");
        } catch (error) {
            setLoading(false);
            toast.error(error.message); // General error message
        }
    };

    // Handle add user to Users collection
    const addUserToFireStore = async (user) => {
        const userRef = doc(db, "users", user.uid);
        const userData = {
            displayName: user.displayName || user.email,
            email: user.email,
            photoURL: user.photoURL,
            role: "user",
            uid: user.uid, 
            loginStatus: "Google"
        };

        try {
            // Add or update user information
            await setDoc(userRef, userData, { merge: true });
            toast.success("User info added to Firestore!");
        } catch (error) {
            console.error("Error adding user info to Firestore: ", error);
            toast.error("Failed to add user info.");
        }
    }

    if (loading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
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
