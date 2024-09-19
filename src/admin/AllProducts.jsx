import React from "react";
import { Container, Row, Col } from "reactstrap";
import useGetData from "../custom-hooks/useGetData";
import { motion } from "framer-motion";
import { db } from "../firebase.config";
import { doc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const AllProducts = () => {
    const { data: productsData, loading } = useGetData("products");

    const deleteProduct = async (id) => {
        await deleteDoc(doc(db, "products", id));
        toast.success("Product deleted successfully!");
    };

    return (
        <section>
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
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <h4 className="py-5 text-center fw-bold">
                                        Loading....
                                    </h4>
                                ) : (
                                    productsData.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <img src={item.imgUrl} alt="" />
                                            </td>
                                            <td className="pdt">{item.productName}</td>
                                            <td className="pdt">{item.category}</td>
                                            <td className="pdt">${item.price}</td>
                                            <td className="pt-4">
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
                </Row>
            </Container>
        </section>
    );
};

export default AllProducts;
