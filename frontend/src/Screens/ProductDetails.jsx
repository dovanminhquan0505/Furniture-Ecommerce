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
import useGetData from "../custom-hooks/useGetData";
import useAdmin from "../custom-hooks/useAdmin";
import useAuth from "../custom-hooks/useAuth";
import { 
    fetchProduct, 
    addReview, 
    deleteReview, 
    toggleLikeReview, 
    addReplyToReview, 
    toggleLikeReply, 
    fetchSellerInfoByProduct,
    getUserById,
    getSellerIdByUserId
} from "../api.js";
import DefaultAvatar from "../assets/images/user-icon.png";

const ProductDetails = () => {
    const [tab, setTab] = useState("desc");
    const reviewMessage = useRef("");
    const dispatch = useDispatch();
    //Handle quality of products
    const [rating, setRating] = useState(null);
    const { id } = useParams();
    const [product, setProduct] = useState({});
    const [ loading, setLoading ] = useState(true);
    const { data: products } = useGetData("products");
    const [isStaticProduct, setIsStaticProduct] = useState(false);
    const { isLoading: adminLoading } = useAdmin();
    const { currentUser } = useAuth();
    // Set Reviews Comment State
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyMessage, setReplyMessage] = useState("");
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState({});
    const [storeName, setStoreName] = useState("");
    const [userData, setUserData] = useState(null);
    const [currentUserSellerId, setCurrentUserSellerId] = useState(null);

    // Fetch thông tin người dùng từ Firestore khi có currentUser
    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const user = await getUserById(currentUser.uid);
                    setUserData({
                        userId: currentUser.uid,
                        userName: user.displayName || "Anonymous",
                        avatar: user.photoURL || DefaultAvatar,
                    });
                    const sellerData = await getSellerIdByUserId(currentUser.uid);
                    setCurrentUserSellerId(sellerData.sellerId || null);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    toast.error("Failed to load user data");
                    setCurrentUserSellerId(null);
                }
            }
        };
        fetchUserData();
    }, [currentUser]);

    // Fetch product data using API
    useEffect(() => {
        const getProductData = async () => {
            try {
                setLoading(true);
                const productData = await fetchProduct(id);
                setProduct(productData);
                setIsStaticProduct(false);
                
                if (Array.isArray(productData.reviews) && productData.reviews.length > 0) {
                    const avgRating = productData.reviews.reduce((sum, review) => sum + review.rating, 0) / productData.reviews.length;
                    setProduct(prev => ({ ...prev, avgRating: avgRating.toFixed(1) }));
                } else {
                    setProduct(prev => ({ ...prev, avgRating: "0.0" }));
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                toast.error("Product not found!");
                setProduct({});
            } finally {
                setLoading(false);
            }
        };

        getProductData();
    }, [id]);

    // Fetch seller info using API
    useEffect(() => {
        const getSellerData = async () => {
            if (product.sellerId) {
                try {
                    const sellerData = await fetchSellerInfoByProduct(product.sellerId);
                    setStoreName(sellerData.storeName || "Unknown Store");
                } catch (error) {
                    console.error("Error fetching seller info:", error);
                    toast.error("Failed to load store information");
                    setStoreName("Unknown Store");
                }
            }
        };

        if (product.sellerId) {
            getSellerData();
        }
    }, [product.sellerId]);

    const {
        imgUrl,
        productName,
        price,
        description,
        shortDesc,
        category,
        reviews,
        avgRating,
        sellerId,
    } = product;

    const totalReviews = Array.isArray(reviews) ? reviews.length : 0;

    //List of related products that users are seeking
    const relatedProducts = products.filter(
        (item) => item.category === category
    );

    //Handle Send experiences of users
    const submitHandler = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            toast.error("Please log in to send reviews.");
            return;
        }

        if (!rating) {
            toast.error("Please select a rating");
            return;
        }

        if (!userData) {
            toast.error("User data not loaded yet. Please try again.");
            return;
        }

        const reviewObject = {
            userId: userData.userId,
            userName: userData.userName, 
            avatar: userData.avatar,     
            message: reviewMessage.current.value,
            rating: rating,
            createdAt: new Date().toISOString(),
            likes: []
        };

        try {
            await addReview(id, { ...reviewObject, userId: userData.userId });
            
            // Cập nhật state ngay lập tức với review mới và tính toán avgRating
            setProduct(prev => {
                const updatedReviews = prev.reviews ? [...prev.reviews, reviewObject] : [reviewObject];
                const newAvgRating = updatedReviews.length > 0 
                    ? (updatedReviews.reduce((sum, review) => sum + review.rating, 0) / updatedReviews.length).toFixed(1)
                    : "0.0";
                return {
                    ...prev,
                    reviews: updatedReviews,
                    avgRating: newAvgRating
                };
            });
        
            toast.success("Review sent successfully!");
        } catch (apiError) {
            console.error("API error:", apiError);
            toast.error("Failed to save review to server: " + apiError.message);
            return; 
        }

        // Reset form
        reviewMessage.current.value = "";
        setRating(null);
        setReviewSubmitted(true);
    };

    // Handle Delete reviews for admin only
    const deleteReviewHandler = async (reviewToDelete, index) => {
        if (!currentUser) {
            toast.error("Please log in to delete reviews.");
            return;
        }

        // Kiểm tra quyền xóa
        const isReviewOwner = reviewToDelete.userId === currentUser.uid;
        const isProductSeller = currentUserSellerId && sellerId === currentUserSellerId;

        if (!isReviewOwner && !isProductSeller) {
            toast.error("You do not have permission to delete this review.");
            return;
        }

        try {
            await deleteReview(id, {
                review: reviewToDelete,
                userId: currentUser.uid,
                userSellerId: currentUserSellerId
            });

            const updatedProduct = await fetchProduct(id);
            if (Array.isArray(updatedProduct.reviews) && updatedProduct.reviews.length > 0) {
                const avgRating = updatedProduct.reviews.reduce((sum, review) => sum + review.rating, 0) / updatedProduct.reviews.length;
                setProduct({ ...updatedProduct, avgRating: avgRating.toFixed(1) });
            } else {
                setProduct({ ...updatedProduct, avgRating: "0.0" });
            }
            toast.success("Review deleted successfully!");
        } catch (error) {
            console.error("Error deleting review:", error);
            toast.error(error.message || "Failed to delete review. Please try again");
        }
    };

    // Handle like reviews
    const toggleLikeReviewHandler = async (review, index) => {
        if (!currentUser) {
            toast.error("Please log in to like reviews.");
            return;
        }
    
        const userId = currentUser.uid;
    
        try {
            if (isStaticProduct) {
                // Handle for static products in local state only
                const updatedReviews = [...product.reviews];
                const likes = updatedReviews[index].likes || [];
                const userLikeIndex = likes.indexOf(userId);
                
                if (userLikeIndex > -1) {
                    likes.splice(userLikeIndex, 1);
                    toast.info("You have disliked this review");
                } else {
                    likes.push(userId);
                    toast.success("You have liked this review");
                }
                
                updatedReviews[index].likes = likes;
                
                setProduct(prev => ({
                    ...prev,
                    reviews: updatedReviews
                }));
            } else {
                await toggleLikeReview(id, index, userId);
                const updatedProduct = await fetchProduct(id); 
                if (Array.isArray(updatedProduct.reviews) && updatedProduct.reviews.length > 0) {
                    const avgRating = updatedProduct.reviews.reduce((sum, review) => sum + review.rating, 0) / updatedProduct.reviews.length;
                    setProduct({ ...updatedProduct, avgRating: avgRating.toFixed(1) });
                } else {
                    setProduct({ ...updatedProduct, avgRating: "0.0" });
                }
                toast.success("Like updated successfully!");
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            toast.error("Failed to update like. Please try again");
        }
    };

    // Handle like replies
    const toggleLikeRepliesHandler = async (reviewIndex, replyIndex) => {
        if (!currentUser) {
            toast.error("Please log in to like replies.");
            return;
        }

        const userId = currentUser.uid;

        try {
            await toggleLikeReply(id, reviewIndex, replyIndex, userId);
            const updatedProduct = await fetchProduct(id); 
            if (Array.isArray(updatedProduct.reviews) && updatedProduct.reviews.length > 0) {
                const avgRating = updatedProduct.reviews.reduce((sum, review) => sum + review.rating, 0) / updatedProduct.reviews.length;
                setProduct({ ...updatedProduct, avgRating: avgRating.toFixed(1) });
            } else {
                setProduct({ ...updatedProduct, avgRating: "0.0" });
            }
            toast.success("Like updated successfully!");
        } catch (error) {
            console.error("Error toggling like for reply:", error);
            toast.error("Failed to update like. Please try again");
        }
    };

    // Handle display all comments or disappear it when user clicks on again.
    const toggleShowReplies = (reviewIndex) => {
        setExpandedReplies(prev => ({
            ...prev,
            [reviewIndex]: !prev[reviewIndex],
        }));
    };
    
    // Handle reply click events
    const handleReplyClick = (reviewIndex, replyIndex = null) => {
        if (replyingTo === reviewIndex) {
            // If reply is open for current review, close it
            setReplyingTo(null);
        } else {
            // Open new reply for current review
            setReplyingTo(reviewIndex);
        }
        setReplyMessage("");
    }

    // Handle submit reply comment
    const handleReplySubmit = async (reviewIndex) => {
        if(!replyMessage.trim()) {
            toast.error("Please fill in both name and message fields.")
            return;
        }

        if (!currentUser) {
            toast.error("Please log in to comment reviews.");
            return;
        }

        if (!userData) {
            toast.error("User data not loaded yet. Please try again.");
            return;
        }

        try {
            await addReplyToReview(id, reviewIndex, {
                userId: userData.userId,
                userName: userData.userName,
                message: replyMessage,
                avatar: userData.avatar,
            });
    
            const updatedProduct = await fetchProduct(id);
            if (Array.isArray(updatedProduct.reviews) && updatedProduct.reviews.length > 0) {
                const avgRating = updatedProduct.reviews.reduce((sum, review) => sum + review.rating, 0) / updatedProduct.reviews.length;
                setProduct({ ...updatedProduct, avgRating: avgRating.toFixed(1) });
            } else {
                setProduct({ ...updatedProduct, avgRating: "0.0" });
            }
            toast.success("Reply sent successfully!");
        } catch (error) {
            console.error("Error adding reply:", error);
            toast.error("Failed to save reply to server: " + error.message);
            return; 
        }

        // Reset form
        setReplyingTo(null);
        setReplyMessage("");
    } 

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

    //when a user send new reviews for product, they start from the top of the page.
    useEffect(() => {
        if (reviewSubmitted) {
            window.scrollTo(0, 0);
            setReviewSubmitted(false); 
        }
    }, [reviewSubmitted]);

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

    if (loading || adminLoading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner style={{ width: '3rem', height: '3rem' }} />
                <span className="visually-hidden">Loading...</span>
            </Container>
        );
    }

    return (
        <Helmet title={` ${productName}`}>
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
                                                            parseFloat(avgRating) || 0
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
                                <p className="mt-3">Store: {storeName || 'Loading...'}</p>

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
                                                reviews.map((item, index) => {
                                                    const isReviewOwner = item.userId === userData?.userId;
                                                    const isProductSeller = currentUserSellerId && sellerId === currentUserSellerId;
                                                    const canDelete = isReviewOwner || isProductSeller;
                                                    return (
                                                        <li
                                                            key={index}
                                                            className="review__item mb-4"
                                                        >
                                                            <div className="review__content">
                                                                <div className="d-flex align-items-center">
                                                                    {item.avatar && (
                                                                        <img
                                                                            src={item.avatar}
                                                                            alt="avatar"
                                                                            className="review__avatar"
                                                                            style={{ width: "40px", height: "40px", borderRadius: "50%", marginRight: "10px" }}
                                                                        />
                                                                    )}
                                                                    <h6 className="mt-2">{item.userName}</h6>
                                                                </div>
                                                                <div
                                                                    className="stars"
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "10px",
                                                                    }}
                                                                >
                                                                    <span className="rating__stars">
                                                                        {[
                                                                            1, 2, 3, 4, 5,
                                                                        ].map(
                                                                            (star) => (
                                                                                <i
                                                                                    key={star}
                                                                                    className={`ri-star-${
                                                                                        star <=
                                                                                        item.rating
                                                                                            ? "fill"
                                                                                            : "line"
                                                                                    }`}
                                                                                    style={{
                                                                                        color:
                                                                                            star <=
                                                                                            item.rating
                                                                                                ? "#FFD700"
                                                                                                : "gray",
                                                                                    }}
                                                                                ></i>
                                                                            )
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Time Reviews */}
                                                            {item.createdAt && (
                                                                <small className="text-muted">
                                                                    {formatTime(
                                                                        item.createdAt
                                                                    )}
                                                                </small>
                                                            )}

                                                            <p className="review__comment">
                                                                {item.message}
                                                            </p>

                                                            <div className="review__actions">
                                                                <motion.span
                                                                    whileTap={{scale: 1.2}} 
                                                                    onClick={() => toggleLikeReviewHandler(item, index)}
                                                                    className="actions__like"
                                                                >
                                                                    {item.likes && item.likes.includes(currentUser?.uid) ? "Dislike" : "Like"}
                                                                    ({item.likes ? item.likes.length : 0})
                                                                </motion.span>
                                                                <motion.span 
                                                                    whileTap={{scale: 1.1}}
                                                                    onClick={() => handleReplyClick(index)}
                                                                >
                                                                    Comment
                                                                </motion.span>
                                                            </div>

                                                            {/* Show replies */}
                                                            {item.replies && item.replies.length > 0 && (
                                                                <motion.span 
                                                                    id={`toggle__replies-${index}`}
                                                                    whileTap={{scale: 1}}
                                                                    className={`toggle__replies ${expandedReplies[index] ? 'expanded' : ''}`}
                                                                    onClick={() => toggleShowReplies(index)}
                                                                >
                                                                    {expandedReplies[index] ? 'Hide' : 'Show'} {item.replies.length} {item.replies.length > 1 ? "replies" : "reply"}
                                                                </motion.span>
                                                            )}

                                                            {/* Display existing replies */}
                                                            {item.replies && item.replies.length > 0 && expandedReplies[index] && (
                                                                <ul className="replies-list">
                                                                {item.replies.map((reply, replyIndex) => (
                                                                    <li key={replyIndex} className="reply-item">
                                                                        <div className="d-flex align-items-center">
                                                                            {reply.avatar && (
                                                                                <img
                                                                                    src={reply.avatar}
                                                                                    alt="avatar"
                                                                                    className="review__avatar"
                                                                                    style={{ width: "30px", height: "30px", borderRadius: "50%", marginRight: "10px" }}
                                                                                />
                                                                            )}
                                                                            <h6>{reply.userName}</h6>
                                                                        </div>
                                                                        <p>{reply.message}</p>
                                                                        <small className="text-muted">
                                                                            {formatTime(reply.createdAt)}
                                                                        </small>
                                                                        <div className="review__actions">
                                                                            <motion.span
                                                                                whileTap={{scale: 1.2}} 
                                                                                onClick={() => toggleLikeRepliesHandler(index, replyIndex)}
                                                                                className="actions__like"
                                                                            >
                                                                                {reply.likes && reply.likes.includes(currentUser?.uid) ? "Dislike" : "Like"}
                                                                                ({reply.likes ? reply.likes.length : 0})
                                                                            </motion.span>
                                                                            <motion.span 
                                                                                whileTap={{scale: 1.1}}
                                                                                onClick={() => handleReplyClick(index)}
                                                                            >
                                                                                Comment
                                                                            </motion.span>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            )}

                                                            {/* Reply form */}
                                                            {replyingTo === index && (
                                                                <div className="reply-form">
                                                                    <textarea
                                                                        placeholder="Your reply"
                                                                        value={replyMessage}
                                                                        onChange={(e) => setReplyMessage(e.target.value)}
                                                                        required
                                                                    ></textarea>
                                                                    <motion.button
                                                                        whileTap={{ scale: 1.2 }}
                                                                        onClick={() => handleReplySubmit(index)}
                                                                        className="buy__btn"
                                                                    >
                                                                        Send Reply
                                                                    </motion.button>
                                                                </div>
                                                            )}

                                                            {canDelete && (
                                                                <span
                                                                    className="delete-review-btn"
                                                                    onClick={() => deleteReviewHandler(item, index)}
                                                                    title="Delete review"
                                                                >
                                                                    <i className="ri-delete-bin-line"></i>
                                                                </span>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                        </ul>

                                        <div className="review__form">
                                            <h4>Leave Your Experience</h4>
                                            <form onSubmit={submitHandler}>
                                                <div className="form__group rating__group">
                                                    {[1, 2, 3, 4, 5].map(
                                                        (star) => (
                                                            <motion.span
                                                                key={star}
                                                                whileTap={{
                                                                    scale: 1.2,
                                                                }}
                                                                onClick={() =>
                                                                    setRating(star)
                                                                }
                                                                style={{
                                                                    cursor: "pointer",
                                                                    color:
                                                                        rating >=
                                                                        star
                                                                            ? "orange"
                                                                            : "gray",
                                                                }}
                                                                className="star__rating-item"
                                                            >
                                                                {star}
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
