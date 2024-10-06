import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Spinner } from "reactstrap";
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
import {
    arrayRemove,
    arrayUnion,
    doc,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import useGetData from "../custom-hooks/useGetData";
import useAdmin from "../custom-hooks/useAdmin";

const ProductDetails = () => {
    const [tab, setTab] = useState("desc");
    const reviewUser = useRef("");
    const reviewMessage = useRef("");
    const dispatch = useDispatch();
    //Handle quality of products
    const [rating, setRating] = useState(null);
    const { id } = useParams();
    const [product, setProduct] = useState({});
    const { data: products } = useGetData("products");
    const docRef = doc(db, "products", id);
    const { isAdmin, isLoading } = useAdmin();

    useEffect(() => {
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const productData = doc.data();
                setProduct(productData);

                // Calculate average rating
                if (
                    Array.isArray(productData.reviews) &&
                    productData.reviews.length > 0
                ) {
                    const avgRating =
                        productData.reviews.reduce(
                            (sum, review) => sum + review.rating,
                            0
                        ) / productData.reviews.length;
                    setProduct((prev) => ({
                        ...prev,
                        avgRating: avgRating.toFixed(1),
                    }));
                }
            } else {
                toast.error("Product not found!");
            }
        });

        // Clean up the listener on unmount
        return () => unsubscribe();
    }, [id]); // Added id as a dependency to make sure the listener updates when the id changes

    const {
        imgUrl,
        productName,
        price,
        description,
        shortDesc,
        category,
        reviews,
        avgRating,
    } = product;

    const totalReviews = Array.isArray(reviews) ? reviews.length : 0;

    //List of related products that users are seeking
    const relatedProducts = products.filter(
        (item) => item.category === category
    );

    //Handle Send experiences of users
    const submitHandler = async (e) => {
        e.preventDefault();

        const reviewUserName = reviewUser.current.value;
        const reviewUserMessage = reviewMessage.current.value;

        if (!rating) {
            toast.error("Please select a rating");
            return;
        }

        const reviewObject = {
            userName: reviewUserName,
            message: reviewUserMessage,
            rating: rating,
            createdAt: new Date().toISOString(),
        };

        try {
            await updateDoc(docRef, {
                reviews: arrayUnion(reviewObject),
            });

            toast.success("Review send successfully!");

            // Reset form review
            reviewUser.current.value = "";
            reviewMessage.current.value = "";
            setRating(null);
        } catch (error) {
            toast.error("Failed to send review. Please try again");
        }
    };

    // Handle Delete reviews for admin only
    const deleteReviews = async (reviewToDelete) => {
        try {
            await updateDoc(docRef, {
                reviews: arrayRemove(reviewToDelete),
            });
            toast.success("Review deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete review. Please try again");
        }
    };

    const addToCart = () => {
        dispatch(
            cartActions.addItemToCart({
                id,
                imgUrl,
                productName,
                price,
                category,
            })
        );

        toast.success("Product added successfully!");
    };

    //when a user switches between products, they start from the top of the page.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [product]);

    // Time format
    const formatTime = (dateString) => {
        const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (isLoading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <Helmet title={productName}>
            <CommonSection title={productName} />

            <section className="pt-0">
                <Container>
                    <Row>
                        <Col lg="6">
                            <img
                                src={imgUrl}
                                alt=""
                                className="img__productDetail"
                            />
                        </Col>

                        <Col lg="6">
                            <div className="product__details">
                                <h2>{productName}</h2>
                                <div className="product__rating d-flex align-items-center gap-5 mb-3">
                                    <div className="stars">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span key={star}>
                                                <i
                                                    className={`ri-star-${
                                                        star <=
                                                        Math.floor(
                                                            avgRating || 0
                                                        )
                                                            ? "fill"
                                                            : "line"
                                                    }`}
                                                ></i>
                                            </span>
                                        ))}
                                    </div>

                                    <p>
                                        <span className="avg-rating">
                                            {avgRating}
                                        </span>
                                        <span className="total-reviews">
                                            ({totalReviews} reviews)
                                        </span>
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
                                    Reviews (
                                    {Array.isArray(reviews)
                                        ? reviews.length
                                        : 0}
                                    )
                                </h6>
                            </div>

                            {tab === "desc" ? (
                                <div className="tab__content mt-3">
                                    <p>{description}</p>
                                </div>
                            ) : (
                                <div className="product__review mt-5">
                                    <div className="review__wrapper">
                                        <ul>
                                            {Array.isArray(reviews) &&
                                                reviews.map((item, index) => (
                                                    <li
                                                        key={index}
                                                        className="review__item mb-4"
                                                    >
                                                        <div className="review__content">
                                                            <h6>
                                                                {item.userName}
                                                            </h6>
                                                            <span className="stars">
                                                                {item.rating}{" "}
                                                                <i class="ri-star-s-fill"></i>
                                                            </span>
                                                            <p>
                                                                {item.message}
                                                            </p>

                                                            {/* Time Reviews */}
                                                            {item.createdAt && (
                                                                <small className="text-muted">
                                                                    Time:{" "}
                                                                    {formatTime(
                                                                        item.createdAt
                                                                    )}
                                                                </small>
                                                            )}
                                                        </div>

                                                        {/* Delete icon for admin only */}
                                                        {!isLoading &&
                                                            isAdmin && (
                                                                <span
                                                                    className="delete-review-btn"
                                                                    onClick={() =>
                                                                        deleteReviews(
                                                                            item
                                                                        )
                                                                    }
                                                                    title="Delete review"
                                                                >
                                                                    <i className="ri-delete-bin-line"></i>
                                                                </span>
                                                            )}
                                                    </li>
                                                ))}
                                        </ul>

                                        <div className="review__form">
                                            <h4>Leave Your Experience</h4>
                                            <form onSubmit={submitHandler}>
                                                <div className="form__group">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter name"
                                                        ref={reviewUser}
                                                        required
                                                    />
                                                </div>

                                                <div className="form__group d-flex align-items-center gap-5 rating__group">
                                                    {[1, 2, 3, 4, 5].map(
                                                        (star) => (
                                                            <motion.span
                                                                key={star}
                                                                whileTap={{
                                                                    scale: 1.2,
                                                                }}
                                                                onClick={() =>
                                                                    setRating(
                                                                        star
                                                                    )
                                                                }
                                                                style={{
                                                                    cursor: "pointer",
                                                                    color:
                                                                        rating >=
                                                                        star
                                                                            ? "orange"
                                                                            : "gray",
                                                                }}
                                                            >
                                                                {star}{" "}
                                                                <i className="ri-star-s-fill"></i>
                                                            </motion.span>
                                                        )
                                                    )}
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
