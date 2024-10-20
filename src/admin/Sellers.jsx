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

const Sellers = () => {
    const { data: sellersData, loading } = useGetData("sellers");
    const { isDarkMode } = useTheme();

    const deleteUser = async (id) => {
        await deleteDoc(doc(db, "sellers", id));
        toast.success("Seller deleted successfully!");
    };
    return (
        <Helmet title=" Sellers">
            <section className={`${isDarkMode ? "dark-mode" : "light-mode"}`}>
                <Container>
                    <Row>
                        <Col lg="12" className="pt-1">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Seller ID</th>
                                        <th>Full Name</th>
                                        <th>Phone</th>
                                        <th>Store Email</th>
                                        <th>Store Name</th>
                                        <th>Business Types</th>
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
                                        sellersData?.map((seller) => (
                                            <tr key={seller.id}>
                                                <td data-label="Seller ID">
                                                    {seller.id}
                                                </td>
                                                <td data-label="Full Name">
                                                    {seller.fullName}
                                                </td>
                                                <td data-label="Phone">
                                                    {seller.phoneNumber}
                                                </td>
                                                <td data-label="Store Email">
                                                    {seller.storeEmail}
                                                </td>
                                                <td data-label="Store Name">
                                                    {seller.storeName}
                                                </td>
                                                <td data-label="Business Types">
                                                    {seller.businessType}
                                                </td>
                                                <td data-label="Action">
                                                    <motion.button
                                                        onClick={() => {
                                                            deleteUser(
                                                                seller.id
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

export default Sellers;
