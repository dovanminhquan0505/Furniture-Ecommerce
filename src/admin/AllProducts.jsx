import React from "react";
import { Container, Row, Col, Spinner } from "reactstrap";
import useGetData from "../custom-hooks/useGetData";
import { motion } from "framer-motion";
import { db } from "../firebase.config";
import { doc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "../styles/all-products.css";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../components/UI/ThemeContext";

const AllProducts = () => {
    const { data: productsData, loading } = useGetData("products");
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const deleteProduct = async (id) => {
        await deleteDoc(doc(db, "products", id));
        toast.success("Product deleted successfully!");
    };

    const editProduct = async (productId) => {
        navigate(`/admin/edit-product/${productId}`)
    };

    return (
        <section className={`${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <Container>
                <Row>
                    <Col lg="12">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <Container
                                    className="d-flex justify-content-center align-items-center"
                                    style={{ height: "100vh" }}
                                >
                                    <Spinner style={{ width: '3rem', height: '3rem' }} />
                                    <span className="visually-hidden">Loading...</span>
                                </Container>
                                ) : (
                                    productsData.map((item) => (
                                        <tr key={item.id}>
                                            <td data-label="Image">
                                                <img src={item.imgUrl} alt="" />
                                            </td>
                                            <td data-label="Title">
                                                {item.productName}
                                            </td>
                                            <td data-label="Category">
                                                {item.category}
                                            </td>
                                            <td data-label="Price">
                                                ${item.price}
                                            </td>
                                            <td data-label="Actions">
                                                <motion.button
                                                    onClick={() => {
                                                        editProduct(item.id);
                                                    }}
                                                    whileTap={{ scale: 1.1 }}
                                                    className="btn btn-primary"
                                                >
                                                    Edit
                                                </motion.button>

                                                <motion.button
                                                    onClick={() => {
                                                        deleteProduct(item.id);
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

                    <Col lg="12">
                        <Link to="/admin/add-product">
                            <motion.button
                                whileTap={{ scale: 1.2 }}
                                className="buy__btn product__btn"
                            >
                                Create Product
                            </motion.button>
                        </Link>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default AllProducts;
