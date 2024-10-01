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
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import useGetData from "../custom-hooks/useGetData";

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

    useEffect(() => {
        const getProduct = async () => {
            try {
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const productData = docSnap.data();
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
            } catch (error) {
                toast.error("Error fetching product data");
                console.error("Error fetching product:", error);
            }
        };

        getProduct();
    }, []);

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
        };

        try {
            await updateDoc(docRef, {
                reviews: arrayUnion(reviewObject),
            });

            // Recalculate avgRating based on new ratings
            const updatedReviews = Array.isArray(product.reviews)
                ? [...product.reviews, reviewObject]
                : [reviewObject];
            const newAvgRating =
                updatedReviews.reduce((sum, review) => sum + review.rating, 0) /
                updatedReviews.length;

            // Update local state
            setProduct((prev) => ({
                ...prev,
                reviews: updatedReviews,
                avgRating: newAvgRating.toFixed(1),
            }));

            toast.success("Review send successfully!");

            // Reset form review
            reviewUser.current.value = "";
            reviewMessage.current.value = "";
            setRating(null);
        } catch (error) {
            toast.error("Failed to send review. Please try again");
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
                                                <i className={`ri-star-${star <= Math.floor(avgRating || 0) ? 'fill' : 'line'}`}></i>
                                            </span>
                                        ))}
                                    </div>

                                    <p>
                                        <span className="avg-rating">{avgRating}</span> 
                                        <span className="total-reviews">({totalReviews} reviews)</span>
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
                                                        className="mb-4"
                                                    >
                                                        <h6>{item.userName}</h6>
                                                        <span className="stars">
                                                            {item.rating}{" "}
                                                            <i class="ri-star-s-fill"></i>
                                                        </span>
                                                        <p>{item.message}</p>
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
