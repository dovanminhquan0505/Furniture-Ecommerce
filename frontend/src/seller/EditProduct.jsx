import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Form, FormGroup, Spinner } from "reactstrap";
import { motion } from "framer-motion";
import { storage } from "../firebase.config";
import { toast } from "react-toastify";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import "../styles/Add-EditProduct.css";
import Helmet from "../components/Helmet/Helmet";
import { fetchProduct, updateProduct } from "../api";

const EditProduct = () => {
    const { productId } = useParams();
    const [productDetails, setProductDetails] = useState({
        productName: "",
        shortDesc: "",
        description: "",
        category: "",
        price: "",
        imgUrl: "",
        sellerId: "",
    });

    const [enterProductImg, setEnterProductImg] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Get product details from firestore
    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                const product = await fetchProduct(productId); 
                setProductDetails(product);
            } catch (error) {
                toast.error("Error fetching product details: " + error.message);
                navigate("/seller/all-products");
            }
        };
        fetchProductDetails();
    }, [productId, navigate]);

    // Handle input changes when seller changes value
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductDetails((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle image changes
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setEnterProductImg(file);
    };

    // Handle update value when seller clicks on update product button
    const updateProductHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imgUrl = productDetails.imgUrl;
            if (enterProductImg) {
                const storageRef = ref(storage, `productImages/${Date.now() + enterProductImg.name}`);
                const uploadTask = uploadBytesResumable(storageRef, enterProductImg);
                imgUrl = await new Promise((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log(`Upload is ${progress}% done`);
                        },
                        reject,
                        async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
                    );
                });
            }

            await updateProduct(productId, { ...productDetails, imgUrl }, productDetails.sellerId);
            setLoading(false);
            toast.success("Product updated successfully!");
            navigate("/seller/all-products");
        } catch (error) {
            setLoading(false);
            toast.error("Product update failed: " + error.message);
        }
    };

    return (
        <Helmet title=" Edit-product">
            <section>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg="8">
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
                                <div className="create-product-form">
                                    <h4 className="mb-4">Edit Product</h4>
                                    <Form onSubmit={updateProductHandler}>
                                        <FormGroup className="form__group">
                                            <span>Product title</span>
                                            <input
                                                type="text"
                                                name="productName"
                                                value={
                                                    productDetails.productName
                                                }
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
                                                value={
                                                    productDetails.description
                                                }
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
                                                    name="category"
                                                    value={
                                                        productDetails.category
                                                    }
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">
                                                        Select Category
                                                    </option>
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

                                                {productDetails.imgUrl && (
                                                    <div>
                                                        <img
                                                            src={
                                                                productDetails.imgUrl
                                                            }
                                                            alt="Current Product"
                                                            style={{
                                                                width: "100px",
                                                                height: "100px",
                                                                objectFit:
                                                                    "cover",
                                                                marginBottom:
                                                                    "10px",
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                <input
                                                    type="file"
                                                    onChange={handleImageChange}
                                                />
                                            </FormGroup>
                                        </div>

                                        <motion.button
                                            whileTap={{ scale: 1.2 }}
                                            className="buy__btn__product"
                                            type="submit"
                                        >
                                            Update Product
                                        </motion.button>
                                    </Form>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default EditProduct;
