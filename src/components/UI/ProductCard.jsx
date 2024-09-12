import React from "react";
import productImage from "../../assets/images/arm-chair-01.jpg"
import "../../styles/product__card.css"
import { motion } from "framer-motion";

const ProductCard = () => {
    return (
        <div className="product__item">
            <div className="product__img">
                <img src={productImage} alt="" />
            </div>
            <h3 className="product__name">Modern Arm Chair</h3>
            <span>Chair</span>
            <div className="product__card-bottom">
                <span className="price">$299</span>
                <span><i class="ri-add-line"></i></span>
            </div>
        </div>
    )
};

export default ProductCard;
