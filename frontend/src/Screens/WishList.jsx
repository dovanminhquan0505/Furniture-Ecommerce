import React from "react";
import { Container, Row, Col } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";
import { useDispatch, useSelector } from "react-redux";
import { wishListActions } from "../redux/slices/wishListSlice";
import { motion } from "framer-motion";
import "../styles/wishlist.css";
import { useNavigate } from "react-router-dom";

const WishList = () => {
    const wishListItems = useSelector((state) => state.wishlist?.wishListItems);
    const navigate = useNavigate();
    const handleNavigateToProductDetails = (id) => {
        navigate(`/shop/${id}`);
    }

    return (
        <Helmet title=" WishList">
            <CommonSection title="Wish List" />
            <section className="wishlist-container">
                <Container>
                    <Row>
                        <Col>
                            {wishListItems.length === 0 ? (
                                <h2 className="wishlist-empty-message">
                                    No Product added to Wishlist
                                </h2>
                            ) : (
                                <table className="wishlist-table bordered">
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Quantity</th>
                                            <th>Delete</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {
                                            wishListItems.map((item, index) => (
                                                <Tr item={item} key={index} onNavigate={handleNavigateToProductDetails} />
                                            ))
                                        }
                                    </tbody>
                                </table>
                            )}
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

const Tr = ({ item, onNavigate }) => {
    const dispatch = useDispatch();

    const deleteProduct = () => {
        dispatch(wishListActions.removeFromWishList(item.id))
    }

    return (
        <tr>
            <th onClick={() => onNavigate(item.id)}>
                <img src={item.imgUrl} alt="" />
            </th>
            <th className="wishlist-product-name" onClick={() => onNavigate(item.id)}>{item.productName}</th>
            <th>{item.category}</th>
            <th className="wishlist-price">${item.price}</th>
            <th className="wishlist-quantity">{item.quantity}</th>
            <th>
                <motion.i
                    whileTap={{
                        scale: 1.2,
                    }}
                    onClick={deleteProduct}
                    className="ri-delete-bin-line wishlist-delete-icon"
                ></motion.i>
            </th>
        </tr>
    );
};

export default WishList;
