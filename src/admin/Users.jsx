import React from "react";
import { Container, Row, Col } from "reactstrap";
import useGetData from "../custom-hooks/useGetData";
import { motion } from "framer-motion";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";

const Users = () => {
    const { data: usersData, loading } = useGetData("users");

    const deleteUser = async (id) => {
        await deleteDoc(doc(db, "users", id));
        toast.success("User deleted successfully!");
    };
    return (
        <section>
            <Container>
                <Row>
                    <Col lg="12">
                        <h4 className="fw-bold">Users</h4>
                    </Col>

                    <Col lg="12" className="pt-5">
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
                                    <h4 className="fw-bold pt-5">
                                        Loading....
                                    </h4>
                                ) : (
                                    usersData?.map((user) => (
                                        <tr key={user.uid}>
                                            <td>
                                                <img
                                                    src={user.photoURL}
                                                    alt=""
                                                />
                                            </td>
                                            <td>{user.displayName}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <motion.button
                                                    onClick={() => {
                                                        deleteUser(user.uid);
                                                    }}
                                                    whileTap={{ scale: 1.1 }}
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
    );
};

export default Users;
