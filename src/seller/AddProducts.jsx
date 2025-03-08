import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup, Spinner } from "reactstrap";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { auth, db, storage } from "../firebase.config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/Add-EditProduct.css";
import Helmet from "../components/Helmet/Helmet";
import { useProducts } from "../contexts/ProductContext";
import { createProduct, getUserById } from "../api";

const AddProducts = () => {
    const [enterTitle, setEnterTitle] = useState("");
    const [enterShortDesc, setEnterShortDesc] = useState("");
    const [enterDescription, setEnterDescription] = useState("");
    const [enterCategory, setEnterCategory] = useState("");
    const [enterPrice, setEnterPrice] = useState("");
    const [enterProductImg, setEnterProductImg] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { products, updateProducts } = useProducts();

    //Create Product
    const addProduct = async (e) => {
        e.preventDefault();
        setLoading(true);

        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error("You must be logged in to create a product");
            setLoading(false);
            return;
        }

        try {
            const idToken = await currentUser.getIdToken();
            const userData = await getUserById(idToken, currentUser.uid);
            const sellerId = userData.sellerId;
      
            const storageRef = ref(storage, `productImages/${Date.now() + enterProductImg.name}`);
            const uploadTask = uploadBytesResumable(storageRef, enterProductImg);
            const downloadURL = await new Promise((resolve, reject) => {
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
      
            const productData = {
              productName: enterTitle,
              shortDesc: enterShortDesc,
              description: enterDescription,
              category: enterCategory,
              price: enterPrice,
              imgUrl: downloadURL,
              sellerId,
            };
      
            const newProduct = await createProduct(idToken, sellerId, productData);
            updateProducts([...products, newProduct]);
      
            setLoading(false);
            toast.success("Product created successfully!");
            navigate("/seller/all-products");
          } catch (error) {
            setLoading(false);
            toast.error("Product creation failed: " + error.message);
          }
    };

    return (
        <Helmet title=" Create-product">
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
                                    <h4 className="mb-4">Create Product</h4>
                                    <Form onSubmit={addProduct}>
                                        <FormGroup className="form__group">
                                            <span>Product title</span>
                                            <input
                                                type="text"
                                                placeholder="Double sofa"
                                                value={enterTitle}
                                                onChange={(e) =>
                                                    setEnterTitle(
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </FormGroup>

                                        <FormGroup className="form__group">
                                            <span>Short Description</span>
                                            <input
                                                type="text"
                                                placeholder="Sample short desc"
                                                value={enterShortDesc}
                                                onChange={(e) =>
                                                    setEnterShortDesc(
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </FormGroup>

                                        <FormGroup className="form__group">
                                            <span>Description</span>
                                            <input
                                                type="text"
                                                placeholder="Description...."
                                                value={enterDescription}
                                                onChange={(e) =>
                                                    setEnterDescription(
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </FormGroup>

                                        <div className="d-flex align-items-center">
                                            <FormGroup className="form__group">
                                                <span>Price</span>
                                                <input
                                                    type="number"
                                                    placeholder="$100"
                                                    value={enterPrice}
                                                    onChange={(e) =>
                                                        setEnterPrice(
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                />
                                            </FormGroup>

                                            <FormGroup className="form__group">
                                                <span>Category</span>
                                                <select
                                                    className="p-2"
                                                    value={enterCategory}
                                                    onChange={(e) =>
                                                        setEnterCategory(
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                >
                                                    <option>
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
                                            className="buy__btn__product"
                                            type="submit"
                                        >
                                            Create Product
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

export default AddProducts;
