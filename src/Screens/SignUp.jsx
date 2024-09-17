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

const Signup = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const register = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            //used to create a new user using an email and password.
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            //The user's information
            const user = userCredential.user;

            //This creates a reference to Firebase Storage where a file (e.g., an image) will be uploaded.
            const storageRef = ref(storage, `images/${Date.now() + username}`);

            //This function uploads the file to the Firebase Storage under the reference created earlier (storageRef).
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                (error) => {
                    toast.error(error.message);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then(
                        async (downloadURL) => {
                            // Update user profile
                            await updateProfile(user, {
                                displayName: username,
                                photoURL: downloadURL,
                            });

                            //store user data in firestore database
                            await setDoc(doc(db, "users", user.uid), {
                                uid: user.uid,
                                displayName: username,
                                email,
                                photoURL: downloadURL,
                            });
                        }
                    );
                }
            );

            console.log(user);
        } catch (error) {
            toast.error("Something went wrong!");
        }
    };

    return (
        <Helmet title=" Register">
            <section>
                <Container>
                    <Row>
                        <Col lg="6" className="m-auto text-center">
                            <h3 className="fw-bold mb-4">Register</h3>

                            <Form className="auth__form" onSubmit={register}>
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
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Signup;
