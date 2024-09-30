import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import { motion } from "framer-motion";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase.config";
import { toast } from "react-toastify";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

const EditProduct = () => {
    const { productId } = useParams();
    const [ productDetails, setProductDetails ] = useState({
        productName: "",
        shortDesc: "",
        description: "",
        category: "",
        price: "",
        imgUrl: "",
    });

    const [ enterProductImg, setEnterProductImg ] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Get product details from firestore
    useEffect(() => {
        const fetchProductDetails = async () => {
            const docRef = doc(db, "products", productId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProductDetails(docSnap.data());
            } else {
                toast.error("Product not found!");
                navigate("/admin/all-products");
            }
        };
        fetchProductDetails();
    }, [productId, navigate]);

    // Handle input changes when admin changes value
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductDetails((prev) =>({
            ...prev,
            [name]: value,
        }))
    }

    // Update the product details in firestore
    const updateProductInFirestore = async (imgUrl) => {
        const docRef = doc(db, "products", productId);
        await updateDoc(docRef, {
            ...productDetails,
            imgUrl: imgUrl,
        })
        setLoading(false);
        toast.success("Product updated successfully!");
        navigate("/admin/all-products");
    }

    // Handle update value when admin clicks on update product button
    const updateProduct = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if(enterProductImg) {
                const storageRef = ref(
                    storage,
                    `productImages/${Date.now() + enterProductImg.name}`
                )
                const uploadTask = uploadBytesResumable(storageRef, enterProductImg);

                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Upload is ${progress}% done`);
                    },
                    (error) => {
                        toast.error("Image upload failed: " + error.message);
                        setLoading(false);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        await updateProductInFirestore(downloadURL);
                    }
                )
            } else {
                // Update without changing the image
                await updateProductInFirestore(productDetails.imgUrl);
            }
        } catch (error) {
            setLoading(false);
            toast.error("Product upload failed!");
        }
    }

    return (
        <section>
            <Container>
                <Row>
                    <Col lg="12">
                        {loading ? (
                            <h4 className="text-center fw-bold">Loading...</h4>
                        ) : (
                            <>
                                <h4 className="mb-4">Edit Product</h4>
                                <Form onSubmit={updateProduct}>
                                    <FormGroup className="form__group">
                                        <span>Product title</span>
                                        <input
                                            type="text"
                                            name="productName"
                                            value={productDetails.productName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </FormGroup>

                                    <FormGroup className="form__group">
                                        <span>Short Description</span>
                                        <input
                                            type="text"
                                            name="shortDesc"
                                            value={productDetails.shortDesc}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </FormGroup>

                                    <FormGroup className="form__group">
                                        <span>Description</span>
                                        <input
                                            type="text"
                                            name="description"
                                            value={productDetails.description}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </FormGroup>

                                    <div className="d-flex align-items-center">
                                        <FormGroup className="form__group">
                                            <span>Price</span>
                                            <input
                                                type="number"
                                                name="price"
                                                value={productDetails.price}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </FormGroup>

                                        <FormGroup className="form__group">
                                            <span>Category</span>
                                            <select
                                                className="p-2"
                                                value={productDetails.category}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                <option value="chair">
                                                    Chair
                                                </option>
                                                <option value="sofa">
                                                    Sofa
                                                </option>
                                                <option value="bed">
                                                    Bed
                                                </option>
                                                <option value="table">
                                                    Table
                                                </option>
                                                <option value="television">
                                                    Television
                                                </option>
                                            </select>
                                        </FormGroup>
                                    </div>

                                    <div>
                                        <FormGroup className="form__group">
                                            <span>Product Image</span>
                                            <input
                                                type="file"
                                                onChange={(e) =>
                                                    setEnterProductImg(
                                                        e.target.files[0]
                                                    )
                                                }
                                                required
                                            />
                                        </FormGroup>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 1.2 }}
                                        className="buy__btn"
                                        type="submit"
                                    >
                                        Update Product
                                    </motion.button>
                                </Form>
                            </>
                        )}
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default EditProduct;