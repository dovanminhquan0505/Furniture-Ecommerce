import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";
import { useParams } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";
import "../styles/product-details.css";
import { motion } from "framer-motion";
import ProductsList from "../components/UI/ProductsList";
import { useDispatch } from "react-redux";
import { cartActions } from "../redux/slices/cartSlice";
import { toast } from "react-toastify";
import { db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import useGetData from '../custom-hooks/useGetData';

const ProductDetails = () => {
    const [product, setProduct] = useState({});

    const [tab, setTab] = useState("desc");
    const reviewUser = useRef("");
    const reviewMessage = useRef("");
    const dispatch = useDispatch();
    //Handle quality of products
    const [rating, setRating] = useState(null);
    const { id } = useParams();
    
    const {data: products} = useGetData('products');
    const docRef = doc(db, 'products', id);

    useEffect(() => {
        const getProduct = async () => {
            const docSnap = await getDoc(docRef);

            if(docSnap.exists()) {
                setProduct(docSnap.data());
            } else {
                console.log('No products!')
            }
        }

        getProduct();
    }, [])

    const {
        imgUrl,
        productName,
        price,
        // avgRating,
        // reviews,
        description,
        shortDesc,
        category,
    } = product;

    //List of related products that users are seeking
    const relatedProducts = products.filter(
        (item) => item.category === category
    );

    //Handle Send experiences of users
    const submitHandler = (e) => {
        e.preventDefault();

        const reviewUserName = reviewUser.current.value;
        const reviewUserMessage = reviewMessage.current.value;

        const reviewObject = {
            userName: reviewUserName,
            message: reviewUserMessage,
            rating: rating,
        };

        console.log(reviewObject);
        toast.success("Review sent successfully!");
    };

    const addToCart = () => {
        dispatch(
            cartActions.addItemToCart({
                id,
                image: imgUrl,
                productName,
                price,
            })
        );

        toast.success("Product added successfully!");
    };

    //when a user switches between products, they start from the top of the page.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [product]);

    return (
        <Helmet title={productName}>
            <CommonSection title={productName} />

            <section className="pt-0">
                <Container>
                    <Row>
                        <Col lg="6">
                            <img src={imgUrl} alt="" />
                        </Col>

                        <Col lg="6">
                            <div className="product__details">
                                <h2>{productName}</h2>
                                <div className="product__rating d-flex align-items-center gap-5 mb-3">
                                    <div>
                                        <span>
                                            <i class="ri-star-s-fill"></i>
                                        </span>
                                        <span>
                                            <i class="ri-star-s-fill"></i>
                                        </span>
                                        <span>
                                            <i class="ri-star-s-fill"></i>
                                        </span>
                                        <span>
                                            <i class="ri-star-s-fill"></i>
                                        </span>
                                        <span>
                                            <i class="ri-star-half-s-line"></i>
                                        </span>
                                    </div>

                                    <p>
                                        {/* (<span>{avgRating}</span> ratings) */}
                                    </p>
                                </div>

                                <div className="d-flex align-items-center gap-5">
                                    <span className="product__price">
                                        ${price}
                                    </span>
                                    <span>Category: {category}</span>
                                </div>
                                <p className="mt-3">{shortDesc}</p>

                                <motion.button
                                    whileTap={{ scale: 1.2 }}
                                    className="buy__btn"
                                    onClick={addToCart}
                                >
                                    Add to Cart
                                </motion.button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            <section>
                <Container>
                    <Row>
                        <Col lg="12">
                            <div className="tab__wrapper d-flex align-items-center gap-5">
                                <h6
                                    className={`${
                                        tab === "desc" ? "active__tab" : ""
                                    }`}
                                    onClick={() => setTab("desc")}
                                >
                                    Description
                                </h6>
                                <h6
                                    className={`${
                                        tab === "rev" ? "active__tab" : ""
                                    }`}
                                    onClick={() => setTab("rev")}
                                >
                                    Reviews
                                </h6>
                            </div>

                            {tab === "desc" ? (
                                <div className="tab__content mt-3">
                                    <p>{description}</p>
                                </div>
                            ) : (
                                <div className="product__review mt-5">
                                    <div className="review__wrapper">
                                        {/* <ul>
                                            {reviews?.map((item, index) => (
                                                <li
                                                    key={index}
                                                    className="mb-4"
                                                >
                                                    <h6>Nguyen Van A</h6>
                                                    <span>
                                                        {item.rating} (ratings)
                                                    </span>
                                                    <p>{item.text}</p>
                                                </li>
                                            ))}
                                        </ul> */}

                                        <div className="review__form">
                                            <h4>Leave Your Experience</h4>
                                            <form
                                                action=""
                                                onSubmit={submitHandler}
                                            >
                                                <div className="form__group">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter name"
                                                        ref={reviewUser}
                                                        required
                                                    />
                                                </div>

                                                <div className="form__group d-flex align-items-center gap-5 rating__group">
                                                    <motion.span
                                                        whileTap={{
                                                            scale: 1.2,
                                                        }}
                                                        onClick={() =>
                                                            setRating(1)
                                                        }
                                                    >
                                                        1
                                                        <i class="ri-star-s-fill"></i>
                                                    </motion.span>
                                                    <motion.span
                                                        whileTap={{
                                                            scale: 1.2,
                                                        }}
                                                        onClick={() =>
                                                            setRating(2)
                                                        }
                                                    >
                                                        2
                                                        <i class="ri-star-s-fill"></i>
                                                    </motion.span>
                                                    <motion.span
                                                        whileTap={{
                                                            scale: 1.2,
                                                        }}
                                                        onClick={() =>
                                                            setRating(3)
                                                        }
                                                    >
                                                        3
                                                        <i class="ri-star-s-fill"></i>
                                                    </motion.span>
                                                    <motion.span
                                                        whileTap={{
                                                            scale: 1.2,
                                                        }}
                                                        onClick={() =>
                                                            setRating(4)
                                                        }
                                                    >
                                                        4
                                                        <i class="ri-star-s-fill"></i>
                                                    </motion.span>
                                                    <motion.span
                                                        whileTap={{
                                                            scale: 1.2,
                                                        }}
                                                        onClick={() =>
                                                            setRating(5)
                                                        }
                                                    >
                                                        5
                                                        <i class="ri-star-s-fill"></i>
                                                    </motion.span>
                                                </div>

                                                <div className="form__group">
                                                    <textarea
                                                        ref={reviewMessage}
                                                        rows={4}
                                                        type="text"
                                                        placeholder="Review Message..."
                                                        required
                                                    />
                                                </div>

                                                <motion.button
                                                    whileTap={{
                                                        scale: 1.2,
                                                    }}
                                                    type="submit"
                                                    className="buy__btn"
                                                >
                                                    Send
                                                </motion.button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Col>

                        <Col lg="12" className="mt-5">
                            <h2 className="related__title">
                                You might also like
                            </h2>
                        </Col>

                        <ProductsList data={relatedProducts} />
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default ProductDetails;
