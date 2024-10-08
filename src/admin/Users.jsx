import React from "react";
import { Container, Row, Col, Spinner } from "reactstrap";
import useGetData from "../custom-hooks/useGetData";
import { motion } from "framer-motion";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import "../styles/all-products.css";
import { useTheme } from "../components/UI/ThemeContext";
import Helmet from "../components/Helmet/Helmet";

const Users = () => {
    const { data: usersData, loading } = useGetData("users");
    const { isDarkMode } = useTheme();

    const deleteUser = async (id) => {
        await deleteDoc(doc(db, "users", id));
        toast.success("User deleted successfully!");
    };
    return (
        <Helmet title=" Users">
            <section className={`${isDarkMode ? "dark-mode" : "light-mode"}`}>
                <Container>
                    <Row>
                        <Col lg="12" className="pt-1">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <Container
                                            className="d-flex justify-content-center align-items-center"
                                            style={{ height: "100vh" }}
                                        >
                                            <Spinner
                                                style={{
                                                    width: "3rem",
                                                    height: "3rem",
                                                }}
                                            />
                                            <span className="visually-hidden">
                                                Loading...
                                            </span>
                                        </Container>
                                    ) : (
                                        usersData?.map((user) => (
                                            <tr key={user.uid}>
                                                <td data-label="Image">
                                                    <img
                                                        className="img__user"
                                                        src={user.photoURL}
                                                        alt=""
                                                    />
                                                </td>
                                                <td data-label="Username">
                                                    {user.displayName}
                                                </td>
                                                <td data-label="Email">
                                                    {user.email}
                                                </td>
                                                <td data-label="Action">
                                                    <motion.button
                                                        onClick={() => {
                                                            deleteUser(
                                                                user.uid
                                                            );
                                                        }}
                                                        whileTap={{
                                                            scale: 1.1,
                                                        }}
                                                        className="btn btn-danger"
                                                    >
                                                        Delete
                                                    </motion.button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Users;
