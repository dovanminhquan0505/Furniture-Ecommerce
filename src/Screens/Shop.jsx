import React, { useState, useEffect, useMemo } from "react";
import CommonSection from "../components/UI/CommonSection";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Spinner } from "reactstrap";
import "../styles/shop.css";
import productsData from "../assets/data/products";
import ProductsList from "../components/UI/ProductsList";
import useGetData from "../custom-hooks/useGetData";

const Shop = () => {
    //Create products based on firebase data
    const { data: productsFirebase, loading } = useGetData("products");
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [sortOrder, setSortOrder] = useState("default");

    // Save database to local storage
    useEffect(() => {
        const allProducts = [...productsData, ...productsFirebase];
        setProducts(allProducts);
        setFilteredProducts(allProducts);
    }, [productsFirebase]);

    // Handle filter products based on category
    const handleFilter = (e) => {
        const filterValue = e.target.value;
        if (filterValue === "all") {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter((item) => item.category === filterValue);
            setFilteredProducts(filtered);
        }
        // localStorage.setItem("productsData", JSON.stringify(filteredProducts));
    };

    // Handle search products
    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const searchedProducts = products.filter((item) =>
            item.productName && item.productName.toLowerCase().includes(searchTerm)
        );
        setFilteredProducts(searchedProducts);
    };

    // Handle sort products based on product name
    const handleSort = (e) => {
        const sortValue = e.target.value;
        setSortOrder(sortValue);
        let sortedProducts = [...filteredProducts];
        if (sortValue === "ascending") {
            sortedProducts.sort((a, b) => a.productName.localeCompare(b.productName));
        } else if (sortValue === "descending") {
            sortedProducts.sort((a, b) => b.productName.localeCompare(a.productName));
        }
        setFilteredProducts(sortedProducts);
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
                                <select onChange={handleSort} value={sortOrder}>
                                    <option value="default">Sort By</option>
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
                            <Container
                                className="d-flex justify-content-center align-items-center"
                                style={{ height: "100vh" }}
                            >
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">
                                        Loading...
                                    </span>
                                </Spinner>
                            </Container>
                        ) : productsData.length === 0 ? (
                            <h1 className="text-center fs-4">
                                Products are not found!
                            </h1>
                        ) : (
                            <ProductsList data={filteredProducts} />
                        )}
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Shop;
