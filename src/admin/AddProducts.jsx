import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { db, storage } from "../firebase.config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const AddProducts = () => {
    const [enterTitle, setEnterTitle] = useState("");
    const [enterShortDesc, setEnterShortDesc] = useState("");
    const [enterDescription, setEnterDescription] = useState("");
    const [enterCategory, setEnterCategory] = useState("");
    const [enterPrice, setEnterPrice] = useState("");
    const [enterProductImg, setEnterProductImg] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    //Create Product
    const createProduct = async (e) => {
        e.preventDefault();
        setLoading(true);

        //Create Product to the Firebase database
        try {
            const docRef = await collection(db, "products");

            const storageRef = ref(
                storage,
                `productImages/${Date.now() + enterProductImg.name}`
            );
            const uploadTask = uploadBytesResumable(
                storageRef,
                enterProductImg
            );

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload is ${progress}% done`);
                },
                () => {
                    toast.error("Images can not uploaded!");
                    setLoading(false);
                },
                async () => {
                    // After uploading finished, update file URL
                    const downloadURL = await getDownloadURL(
                        uploadTask.snapshot.ref
                    );
                    // Add a new document to Firestore with the URL of the uploaded image
                    await addDoc(docRef, {
                        productName: enterTitle,
                        shortDesc: enterShortDesc,
                        description: enterDescription,
                        category: enterCategory,
                        price: enterPrice,
                        imgUrl: downloadURL,
                    });
                }
            );
            setLoading(false);
            toast.success("Product created successfully!");
            navigate("/dashboard/all-products");
        } catch (error) {
            setLoading(false);
            toast.error("Something went wrong!");
        }
    };

    return (
        <section>
            <Container>
                <Row>
                    <Col lg="12">
                        {loading ? (
                            <h4 className="text-center fw-bold">Loading...</h4>
                        ) : (
                            <>
                                <h4 className="mb-4">Create Product</h4>
                                <Form onSubmit={createProduct}>
                                    <FormGroup className="form__group">
                                        <span>Product title</span>
                                        <input
                                            type="text"
                                            placeholder="Double sofa"
                                            value={enterTitle}
                                            onChange={(e) =>
                                                setEnterTitle(e.target.value)
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
                                                <option>Select Category</option>
                                                <option value="chair">
                                                    Chair
                                                </option>
                                                <option value="sofa">
                                                    Sofa
                                                </option>
                                                <option value="mobile">
                                                    Mobile
                                                </option>
                                                <option value="watch">
                                                    Watch
                                                </option>
                                                <option value="wireless">
                                                    Wireless
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
                                        Create Product
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

export default AddProducts;
