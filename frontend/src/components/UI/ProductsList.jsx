import React from "react";
import ProductCard from "./ProductCard";

const ProductsList = ({ data }) => {
    return (
        <div className="products-grid">
            {data?.map((item, index) => (
                <ProductCard item={item} key={index} />
            ))}
        </div>
    );
};

export default ProductsList;
