import React, { useState, useEffect } from "react";
import CommonSection from "../components/UI/CommonSection";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Spinner } from "reactstrap";
import "../styles/shop.css";
import ProductsList from "../components/UI/ProductsList";
import useGetData from "../custom-hooks/useGetData";

const Shop = () => {
    //Create products based on firebase data
    const { data: productsFirebase, loading } = useGetData("products");
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [sortOrder, setSortOrder] = useState("default");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Save database to local storage
    useEffect(() => {
        if (productsFirebase) {
            setProducts(productsFirebase);
            setFilteredProducts(productsFirebase);
        }
    }, [productsFirebase]);

    const categories = [
        { value: "all", label: "All products" },
        { value: "sofa", label: "Sofa" },
        { value: "bed", label: "Bed" },
        { value: "chair", label: "Chair" },
        { value: "table", label: "Table" },
        { value: "television", label: "Tivi" }
    ];

    const getCategoryCount = (categoryValue) => {
        if (categoryValue === "all") return products.length;
        return products.filter(item => item.category === categoryValue).length;
    };

    // Handle filter products based on category
    const handleFilter = (filterValue) => {
        setSelectedCategory(filterValue);
        let filtered = products;
        
        if (filterValue !== "all") {
            filtered = products.filter((item) => item.category === filterValue);
        }
        
        // Apply search if exists
        if (searchTerm) {
            filtered = filtered.filter((item) =>
                item.productName && item.productName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredProducts(filtered);
    };

    // Handle search products
    const handleSearch = (e) => {
        const searchValue = e.target.value.toLowerCase();
        setSearchTerm(searchValue);
        
        let filtered = products;
        
        // Apply category filter
        if (selectedCategory !== "all") {
            filtered = filtered.filter((item) => item.category === selectedCategory);
        }
        
        // Apply search
        if (searchValue) {
            filtered = filtered.filter((item) =>
                item.productName && item.productName.toLowerCase().includes(searchValue)
            );
        }
        
        setFilteredProducts(filtered);
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
        } else if (sortValue === "price-asc") {
            sortedProducts.sort((a, b) => a.price - b.price);
        } else if (sortValue === "price-desc") {
            sortedProducts.sort((a, b) => b.price - a.price);
        }
        
        setFilteredProducts(sortedProducts);
    };

    const handleResetFilters = () => {
        setSelectedCategory("all");
        setSearchTerm("");
        setSortOrder("default");
        setFilteredProducts(products);
    };

    return (
        <Helmet title="Shop">
            <CommonSection title="Products" />

            <section className="shop__section">
                <Container fluid>
                    <Row>
                        {/* Sidebar Filter */}
                        <Col lg="3" md="4" className="sidebar__col">
                            <div className="filter__sidebar">
                                <div className="filter__header">
                                    <h3>
                                        <i className="ri-filter-3-line"></i>
                                        Product Filter
                                    </h3>
                                </div>

                                {/* Search Filter */}
                                <div className="filter__group">
                                    <h4>Search</h4>
                                    <div className="search__box">
                                        <input
                                            type="text"
                                            placeholder="Searching product..."
                                            value={searchTerm}
                                            onChange={handleSearch}
                                        />
                                        <span>
                                            <i className="ri-search-line"></i>
                                        </span>
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <div className="filter__group">
                                    <h4>Category</h4>
                                    <div className="category__list">
                                        {categories.map(category => (
                                            <button
                                                key={category.value}
                                                className={`category__item ${selectedCategory === category.value ? 'active' : ''}`}
                                                onClick={() => handleFilter(category.value)}
                                            >
                                                <span>{category.label}</span>
                                                <span className="category__count">
                                                    {getCategoryCount(category.value)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sort Filter */}
                                <div className="filter__group">
                                    <h4>Sort</h4>
                                    <div className="filter__widget">
                                        <select onChange={handleSort} value={sortOrder}>
                                            <option value="default">Default</option>
                                            <option value="ascending">Name A-Z</option>
                                            <option value="descending">Name Z-A</option>
                                            <option value="price-asc">Price low to high</option>
                                            <option value="price-desc">Price high to low</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Reset Button */}
                                <button 
                                    className="reset__filters__btn"
                                    onClick={handleResetFilters}
                                >
                                    <i className="ri-refresh-line"></i>
                                    Xóa bộ lọc
                                </button>
                            </div>
                        </Col>

                        {/* Products Area */}
                        <Col lg="9" md="8" className="products__col">
                            <div className="products__header">
                                <div className="products__count">
                                    <span>Hiển thị {filteredProducts.length} sản phẩm</span>
                                </div>
                            </div>

                            <div className="products__content">
                                {loading ? (
                                    <div className="loading__container">
                                        <Spinner style={{ width: '3rem', height: '3rem' }} />
                                        <span className="loading__text">Đang tải sản phẩm...</span>
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="no__products">
                                        <i className="ri-shopping-bag-line"></i>
                                        <h3>Không tìm thấy sản phẩm!</h3>
                                        <p>Vui lòng thử lại sau</p>
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="no__products">
                                        <i className="ri-search-line"></i>
                                        <h3>Không có sản phẩm phù hợp</h3>
                                        <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                        <button 
                                            className="btn__secondary"
                                            onClick={handleResetFilters}
                                        >
                                            Xóa bộ lọc
                                        </button>
                                    </div>
                                ) : (
                                    <ProductsList data={filteredProducts} />
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Shop;
