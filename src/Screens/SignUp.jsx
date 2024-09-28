import React, { useState } from "react";
import "../styles/signup.css";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
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
                const storageRef = ref(storage, `images/${Date.now() + username}`);
                //This function uploads the file to the Firebase Storage under the reference created earlier (storageRef).
                const uploadTask = uploadBytesResumable(storageRef, file);
                
                // Listen the process of uploading
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Upload is ${progress}% done`);
                    },
                    (error) => {
                        toast.error(error.message);
                        setLoading(false);
                    },
                    async () => {
                        // After uploading finished, update file URL
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        
                        // Update information about user's profile
                        await updateProfile(user, {
                            displayName: username,
                            photoURL: downloadURL,
                        });
                        
                        const role = email === process.env.REACT_APP_FURNITURE_ECOMMERCE_ADMIN_EMAIL ? "admin" : "user";

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
                toast.error("Email is already in use. Please try another email.");
            } else {
                toast.error(error.message || "Something went wrong!");
            }
        }
    };

    return (
        <Helmet title=" Register">
            <section>
                <Container>
                    <Row>
                        {loading ? (
                            <Col lg="12" className="text-center">
                                <h5 className="fw-bold">Loading...</h5>
                            </Col>
                        ) : (
                            <Col lg="6" className="m-auto text-center">
                                <h3 className="fw-bold mb-4">Register</h3>

                                <Form
                                    className="auth__form"
                                    onSubmit={register}
                                >
                                    <FormGroup className="form__group">
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) =>
                                                setUsername(e.target.value)
                                            }
                                        />
                                    </FormGroup>
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

                                    <FormGroup className="form__group">
                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                setFile(e.target.files[0])
                                            }
                                        />
                                    </FormGroup>

                                    <motion.button
                                        whileTap={{ scale: 1.2 }}
                                        type="submit"
                                        className="buy__btn auth__btn mb-3"
                                    >
                                        Sign up
                                    </motion.button>

                                    <p>
                                        Already have any accounts?{" "}
                                        <Link to="/login">Login</Link>
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
