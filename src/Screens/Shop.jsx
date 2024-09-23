import React, { useState, useEffect, useMemo } from "react";
import CommonSection from "../components/UI/CommonSection";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col } from "reactstrap";
import "../styles/shop.css";
import products from "../assets/data/products";
import ProductsList from "../components/UI/ProductsList";
import useGetData from "../custom-hooks/useGetData";

const Shop = () => {
    const { data: productsFirebase, loading } = useGetData("products");
    const initialProducts = useMemo(() => {
        return products;
    },[]);
    const allProducts = useMemo(() => {
        return [...initialProducts, ...productsFirebase];
    }, [initialProducts, productsFirebase])

    const [productsData, setProductsData] = useState([]);

    // Lưu dữ liệu vào localStorage
    useEffect(() => {
        if (!loading) {
            const storedProducts = JSON.parse(
                localStorage.getItem("productsData")
            );
            if (storedProducts && storedProducts.length > 0) {
                setProductsData(storedProducts);
            } else {
                setProductsData(allProducts);
                localStorage.setItem("productsData", JSON.stringify(allProducts));
            }
        }
    }, [loading, allProducts]);

    const handleFilter = (e) => {
        const filterValue = e.target.value;
        let filteredProducts;
        if (filterValue === "all") {
            filteredProducts = allProducts;
        } else {
            filteredProducts = allProducts.filter(
                (item) => item.category === filterValue
            );
        }
        setProductsData(filteredProducts);
        localStorage.setItem("productsData", JSON.stringify(filteredProducts));
    };

    const handleSearch = (e) => {
        const searchTerm = e.target.value;
        const searchedProducts = allProducts.filter(
            (item) =>
                item.productName &&
                item.productName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
        );
        setProductsData(searchedProducts);
        localStorage.setItem("productsData", JSON.stringify(searchedProducts));
    };

    return (
        <Helmet title=" Shop">
            <CommonSection title="Products" />

            <section>
                <Container>
                    <Row>
                        <Col lg="3" md="4">
                            <div className="filter__widget">
                                <select onChange={handleFilter}>
                                    <option value="all">
                                        Filter By Category
                                    </option>
                                    <option value="sofa">Sofa</option>
                                    <option value="bed">Bed</option>
                                    <option value="chair">Chair</option>
                                    <option value="table">Table</option>
                                    <option value="television">
                                        Television
                                    </option>
                                </select>
                            </div>
                        </Col>
                        <Col lg="3" md="6" className="text-start">
                            <div className="filter__widget">
                                <select>
                                    <option>Sort By</option>
                                    <option value="ascending">Ascending</option>
                                    <option value="descending">
                                        Descending
                                    </option>
                                </select>
                            </div>
                        </Col>
                        <Col lg="6" md="12">
                            <div className="search__box">
                                <input
                                    type="text"
                                    placeholder="Search....."
                                    onChange={handleSearch}
                                />
                                <span>
                                    <i class="ri-search-line"></i>
                                </span>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            <section className="pt-0">
                <Container>
                    <Row>
                        {loading ? (
                            <h4 className="fw-bold text-center">Loading....</h4>
                        ) : productsData.length === 0 ? (
                            <h1 className="text-center fs-4">
                                Products are not found!
                            </h1>
                        ) : (
                            <ProductsList data={productsData} />
                        )}
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Shop;
