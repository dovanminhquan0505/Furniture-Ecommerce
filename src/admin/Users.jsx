import React, { useEffect, useState } from "react";
import { Container, Row, Col, Spinner } from "reactstrap";
import { motion } from "framer-motion";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import "../styles/all-products.css";
import { useTheme } from "../components/UI/ThemeContext";
import Helmet from "../components/Helmet/Helmet";
import { deleteUserAdmin, getAllUsersAdmin } from "../api";

const Users = () => {
    const [usersData, setUsersData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isDarkMode } = useTheme();

    useEffect(() => {
        const fetchUsers = async () => {
            const user = auth.currentUser;
            if (!user) {
                toast.error("Unauthorized! Please log in again.");
                return;
            }

            try {
                const users = await getAllUsersAdmin();
                setUsersData(users);
            } catch (error) {
                toast.error("Failed to fetch users: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleDeleteUser = async (id) => {
        const user = auth.currentUser;
        if (!user) {
            toast.error("No authenticated user found!");
            return;
        }

        try {
            await deleteUserAdmin(id);
            setUsersData((prev) => prev.filter((user) => user.uid !== id));
            toast.success("User deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete user: " + error.message);
        }
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
                                                            handleDeleteUser(
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
