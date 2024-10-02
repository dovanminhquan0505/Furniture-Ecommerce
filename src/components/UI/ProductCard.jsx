import React from "react";
import "../../styles/product-card.css";
import { motion } from "framer-motion";
import { Col } from "reactstrap";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { cartActions } from "../../redux/slices/cartSlice";
import { toast } from "react-toastify";
import { wishListActions } from "../../redux/slices/wishListSlice";

const ProductCard = ({ item }) => {
    //Add product to cart
    const dispatch = useDispatch();
    const wishListItems = useSelector((state) => state.wishlist.wishListItems);

    const addToCart = () => {
        dispatch(
            cartActions.addItemToCart({
                id: item.id,
                productName: item.productName,
                price: item.price,
                imgUrl: item.imgUrl,
                category: item.category,
            })
        );

        toast.success("Product added successfully!");
    };

    // Add product to wish list
    const addToWishList = () => {
        const existingItem = wishListItems.find(wishItem => wishItem.id === item.id);

        if(existingItem) {
            toast.error("You have already saved this product!")
        } else {
            dispatch(wishListActions.addToWishList(item));
            toast.success("Product added to wishlist successfully!");
        }
    }

    return (
        <Col lg="3" md="4" className="mb-2">
            <div className="product__item">
                <div className="product__img">
                    <motion.img
                        whileHover={{ scale: 0.9 }}
                        src={item.imgUrl}
                        alt={item.productName}
                    />

                    {/* Display overlay when user hover */}
                    <div className="product__overlay">
                        <motion.i
                            className="ri-heart-line heart__icon"
                            whileTap={{ scale: 1.2 }}
                            onClick={addToWishList}
                        ></motion.i>
                    </div>
                </div>
                <div className="p-2 product__info">
                    <h3 className="product__name">
                        <Link to={`/shop/${item.id}`}>{item.productName}</Link>
                    </h3>
                    <span>{item.category}</span>
                </div>
                <div className="product__card-bottom d-flex align-items-center justify-content-between p-2">
                    <span className="price">${item.price}</span>
                    <motion.span whileTap={{ scale: 1.2 }} onClick={addToCart}>
                        <i class="ri-add-line"></i>
                    </motion.span>
                </div>
            </div>
        </Col>
    );
};

export default ProductCard;
