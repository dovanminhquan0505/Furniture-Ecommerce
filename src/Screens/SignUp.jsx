import React, { useState } from "react";
import "../styles/signup.css";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup, Spinner } from "reactstrap";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { setDoc, doc } from "firebase/firestore";
import { auth } from "../firebase.config";
import { storage } from "../firebase.config";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Signup = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
            //used to create a new user using an email and password.
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            //The user's information
            const user = userCredential.user;

            if (user) {
                //This creates a reference to Firebase Storage where a file (e.g., an image) will be uploaded.
                const storageRef = ref(
                    storage,
                    `images/${Date.now() + username}`
                );
                //This function uploads the file to the Firebase Storage under the reference created earlier (storageRef).
                const uploadTask = uploadBytesResumable(storageRef, file);

                // Listen the process of uploading
                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        const progress =
                            (snapshot.bytesTransferred / snapshot.totalBytes) *
                            100;
                        console.log(`Upload is ${progress}% done`);
                    },
                    (error) => {
                        toast.error(error.message);
                        setLoading(false);
                    },
                    async () => {
                        // After uploading finished, update file URL
                        const downloadURL = await getDownloadURL(
                            uploadTask.snapshot.ref
                        );

                        // Update information about user's profile
                        await updateProfile(user, {
                            displayName: username,
                            photoURL: downloadURL,
                        });

                        const role =
                            email ===
                            process.env
                                .REACT_APP_FURNITURE_ECOMMERCE_ADMIN_EMAIL
                                ? "admin"
                                : "user";

                        // Save the user's information to firebase database
                        await setDoc(doc(db, "users", user.uid), {
                            uid: user.uid,
                            displayName: username,
                            email,
                            photoURL: downloadURL,
                            role: role,
                        });

                        setLoading(false);
                        toast.success("Account created successfully!");
                        navigate("/checkout");
                    }
                );
            }
        } catch (error) {
            setLoading(false);
            //Check if user use email existed before
            if (error.code === "auth/email-already-in-use") {
                toast.error(
                    "Email is already in use. Please try another email."
                );
            } else {
                toast.error(error.message || "Something went wrong!");
            }
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
                            <Spinner style={{ width: '3rem', height: '3rem' }} />
                            <span className="visually-hidden">Loading...</span>
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
                                        />
                                    </FormGroup>
                                    <FormGroup className="signup__formGroup">
                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                setFile(e.target.files[0])
                                            }
                                            className="signup__input"
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
