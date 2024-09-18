import React, {useState} from "react";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import { motion } from "framer-motion";

const AddProducts = () => {
    const [enterTitle, setEnterTitle] = useState('');
    const [enterShortDesc, setEnterShortDesc] = useState('');
    const [enterDescription, setEnterDescription] = useState('');
    const [enterCategory, setEnterCategory] = useState('');
    const [enterPrice, setEnterPrice] = useState('');

    return (
        <section>
            <Container>
                <Row>
                    <Col lg="12">
                        <h4 className="mb-4">Create Product</h4>
                        <Form>
                            <FormGroup className="form__group">
                                <span>Product title</span>
                                <input type="text" placeholder="Double sofa" />
                            </FormGroup>

                            <FormGroup className="form__group">
                                <span>Short Description</span>
                                <input
                                    type="text"
                                    placeholder="Sample short desc"
                                />
                            </FormGroup>

                            <FormGroup className="form__group">
                                <span>Description</span>
                                <input
                                    type="text"
                                    placeholder="Description...."
                                />
                            </FormGroup>

                            <div className="d-flex align-items-center">
                                <FormGroup className="form__group">
                                    <span>Price</span>
                                    <input type="number" placeholder="$100" />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <span>Category</span>
                                    <select className="p-2">
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
                                    <input type="file" />
                                </FormGroup>
                            </div>

                            <motion.button whileTap={{ scale: 1.2 }} className="buy__btn">
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
