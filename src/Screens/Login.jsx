import React, { useState } from "react";
import "../styles/login.css";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup, Spinner } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase.config";
import { toast } from "react-toastify";
import logoGoogle from "../assets/images/logoGoogle.jpg";
import axios from "axios";
import { useDispatch } from "react-redux";
import { userActions } from "../redux/slices/userSlice";

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

        // try {
        //     const userCredential = await signInWithEmailAndPassword(
        //         auth,
        //         email,
        //         password
        //     );

        //     const user = userCredential.user;

        //     const userDocRef = doc(db, "users", user.uid);
        //     const userDoc = await getDoc(userDocRef);

        //     if (userDoc.exists()) {
        //         const userData = userDoc.data();
        //         if (userData.role === "admin") {
        //             console.log("Admin logged in, navigating to dashboard");
        //             localStorage.setItem('userRole', 'admin');
        //             navigate("/admin/dashboard");
        //         } else {
        //             console.log("Regular user logged in, navigating to checkout");
        //             localStorage.setItem('userRole', 'user');
        //             navigate("/checkout");
        //         }
        //     } else {
        //         console.warn("User document not found, treating as regular user");
        //         localStorage.setItem('userRole', 'user');
        //         navigate("/checkout");
        //     }

        //     setLoading(false);
        //     toast.success("Successfully logged in!");
        // } catch (error) {
        //     setLoading(false);
            
        //     switch (error.code) {
        //         case "auth/wrong-password":
        //             toast.error("Wrong Password!");
        //             break;
        //         case "auth/user-not-found":
        //             toast.error("Account not found!");
        //             break;
        //         case "auth/invalid-email":
        //             toast.error("Invalid Email!");
        //             break;
        //         case "auth/invalid-credential":
        //             toast.error("Invalid Login Information!");
        //             break;
        //         default:
        //             toast.error(error.message); // General error message
        //     }
        // }

        try {
            console.log("Sending login request to API");
            
            // Gọi API đăng nhập từ backend
            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                { email, password },
                { headers: { 'Content-Type': 'application/json' } }
            );
    
            console.log("Login response:", response.data);
    
            const { user, token } = response.data;
            localStorage.setItem('authToken', token);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('user', JSON.stringify(user));
    
            dispatch(userActions.setUser(user));

            setLoading(false);
            toast.success("Successfully logged in!");
    
            // Chuyển hướng dựa vào vai trò
            if (user.role === "admin") {
                console.log("Admin logged in, navigating to dashboard");
                navigate("/admin/dashboard");
            } else {
                console.log("Regular user logged in, navigating to checkout");
                navigate("/checkout");
            }
        } catch (error) {
            setLoading(false);
            console.error("Login error:", error);
            
            // Xử lý các lỗi từ API
            const errorMessage = error.response?.data?.error || error.message || "Login failed!";
            toast.error(errorMessage);
        }
    };

    // Sign In for Google account.
    const signInWithGoogle = async () => {
        // setLoading(true);
        // try {
        //     // Redirect đến API xác thực Google của backend
        //     window.location.href = "http://localhost:5000/api/auth/google";
        //     const result = await signInWithPopup(auth, googleProvider);
        //     const idToken = await result.user.getIdToken();
            
        //     // Gửi idToken lên backend để xác thực
        //     const response = await axios.post(
        //         "http://localhost:5000/api/auth/google-login",
        //         { idToken }
        //     );
            
        //     const { user, token } = response.data;
        //     localStorage.setItem('authToken', token);
        //     localStorage.setItem('userRole', user.role);
        //     localStorage.setItem('user', JSON.stringify(user));
            
        //     navigate("/checkout");
        // } catch (error) {
        //     setLoading(false);
        //     toast.error("Failed to login with Google!");
        //     console.error(error); // General error message
        // }
    };

    // // Handle add user to Users collection
    // const addUserToFireStore = async (user) => {
    //     const userRef = doc(db, "users", user.uid);
    //     const userData = {
    //         displayName: user.displayName || user.email,
    //         email: user.email,
    //         photoURL: user.photoURL,
    //         role: "user",
    //         uid: user.uid, 
    //         loginStatus: "Google"
    //     };

    //     try {
    //         // Add or update user information
    //         await setDoc(userRef, userData, { merge: true });
    //         toast.success("User info added to Firestore!");
    //     } catch (error) {
    //         console.error("Error adding user info to Firestore: ", error);
    //         toast.error("Failed to add user info.");
    //     }
    // }

    if (loading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner style={{ width: '3rem', height: '3rem' }} />
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
