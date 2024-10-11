import React, { useEffect, useState } from "react";
import { Container, Row, Col, Spinner } from "reactstrap";
import { motion } from "framer-motion";
import { auth, db } from "../firebase.config";
import { doc, deleteDoc, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "../styles/all-products.css";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../components/UI/ThemeContext";
import Helmet from "../components/Helmet/Helmet";
import { useProducts } from "../contexts/ProductContext";

const AllProducts = () => {
    const { products, addProduct } = useProducts();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [ sellerId, setSellerId ] = useState(null);

    useEffect(() => {
        const fetchSellerData = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("You must be logged in to view your products");
                navigate("/login");
                return;
            }

            const userDocRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setSellerId(userData.sellerId);
            } else {
                toast.error("User not found");
                navigate("/register"); 
            }
        };

        fetchSellerData();
    }, [navigate, setSellerId]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!sellerId) return;

            const productsRef = collection(db, "products");
            const q = query(productsRef, where("sellerId", "==", sellerId));
            const querySnapShot = await getDocs(q);
            const fetchedProducts = [];
            querySnapShot.forEach((doc) => {
                fetchedProducts.push({ id: doc.id, ...doc.data() });
            });
            fetchedProducts.forEach(product => addProduct(product)); 
            setLoading(false);
        };

        fetchProducts();
    }, [sellerId, addProduct]);

    const deleteProduct = async (id) => {
        await deleteDoc(doc(db, "products", id));
        toast.success("Product deleted successfully!");
        const updatedProducts = products.filter(product => product.id !== id);
        updatedProducts.forEach(product => addProduct(product));
    };

    const editProduct = async (productId) => {
        navigate(`/seller/edit-product/${productId}`);
    };

    return (
        <Helmet title=" All-Products">
            <section className={`${isDarkMode ? "dark-mode" : "light-mode"}`}>
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
                                    ) : products.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center fw-bold">No products found</td>
                                        </tr>
                                    ) : (
                                        (
                                            products.map((item) => (
                                                <tr key={item.id}>
                                                    <td data-label="Image">
                                                        <img
                                                            src={item.imgUrl}
                                                            alt=""
                                                        />
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
                                                                editProduct(
                                                                    item.id
                                                                );
                                                            }}
                                                            whileTap={{
                                                                scale: 1.1,
                                                            }}
                                                            className="btn btn-primary"
                                                        >
                                                            Edit
                                                        </motion.button>
    
                                                        <motion.button
                                                            onClick={() => {
                                                                deleteProduct(
                                                                    item.id
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
                                        )
                                    )}
                                </tbody>
                            </table>
                        </Col>

                        <Col lg="12">
                            <Link to="/seller/add-product">
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
        </Helmet>
    );
};

export default AllProducts;
