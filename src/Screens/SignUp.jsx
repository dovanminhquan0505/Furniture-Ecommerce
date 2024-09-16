import React, { useState } from "react";
import "../styles/signup.css";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.config";

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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log(user);
        } catch (error) {
            
        }
    }

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
