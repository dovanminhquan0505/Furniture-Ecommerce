import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup, Card } from "reactstrap";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { db, storage } from "../firebase.config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

const AddProducts = () => {
    const [enterTitle, setEnterTitle] = useState("");
    const [enterShortDesc, setEnterShortDesc] = useState("");
    const [enterDescription, setEnterDescription] = useState("");
    const [enterCategory, setEnterCategory] = useState("");
    const [enterPrice, setEnterPrice] = useState("");
    const [enterProductImg, setEnterProductImg] = useState(null);
    const [loading, setLoading] = useState(false);

    //Create Product
    const createProduct = async (e) => {
        e.preventDefault();

        // const product = {
        //     title: enterTitle,
        //     shortDesc: enterShortDesc,
        //     description: enterDescription,
        //     category: enterCategory,
        //     price: enterPrice,
        //     imgURL: enterProductImg,
        // };

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
                        title: enterTitle,
                        shortDesc: enterShortDesc,
                        description: enterDescription,
                        category: enterCategory,
                        price: enterPrice,
                        imgURL: downloadURL,
                    });
                    toast.success("Product created successfully!");
                    setLoading(false);
                }
            );
        } catch (error) {}

        // console.log(product);
    };

    return (
        <section>
            <Container>
                <Row>
                    <Col lg="12">
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
                                        setEnterShortDesc(e.target.value)
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
                                        setEnterDescription(e.target.value)
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
                                            setEnterPrice(e.target.value)
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
                                            setEnterCategory(e.target.value)
                                        }
                                        required
                                    >
                                        <option value="chair">Chair</option>
                                        <option value="sofa">Sofa</option>
                                        <option value="mobile">Mobile</option>
                                        <option value="watch">Watch</option>
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
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default AddProducts;
