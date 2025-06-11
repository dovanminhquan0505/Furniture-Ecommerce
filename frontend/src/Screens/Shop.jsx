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
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 6;

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

    const resetPagination = () => {
        setCurrentPage(1);
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
        resetPagination();
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
        resetPagination();
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
        resetPagination();
    };

    const handleResetFilters = () => {
        setSelectedCategory("all");
        setSearchTerm("");
        setSortOrder("default");
        setFilteredProducts(products);
        resetPagination();
    };

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        // Scroll to top of products section
        document.querySelector('.products__content')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start' 
        });
    };

    const generatePageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }
        }
        
        return pageNumbers;
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
                                    Clear Filter
                                </button>
                            </div>
                        </Col>

                        {/* Products Area */}
                        <Col lg="9" md="8" className="products__col">
                            <div className="products__header">
                                <div className="products__count">
                                    <span>
                                        Display {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} 
                                        {' '}of {filteredProducts.length} products
                                        {totalPages > 1 && ` (Page ${currentPage}/${totalPages})`}
                                    </span>
                                </div>
                            </div>

                            <div className="products__content">
                                {loading ? (
                                    <div className="loading__container">
                                        <Spinner style={{ width: '3rem', height: '3rem' }} />
                                        <span className="loading__text">Loading product...</span>
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="no__products">
                                        <i className="ri-shopping-bag-line"></i>
                                        <h3>Not found products!</h3>
                                        <p>Please try again</p>
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="no__products">
                                        <i className="ri-search-line"></i>
                                        <h3>No matching products</h3>
                                        <p>Try changing your search filters or keywords</p>
                                        <button 
                                            className="btn__secondary"
                                            onClick={handleResetFilters}
                                        >
                                            Clear Filter
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <ProductsList data={currentProducts} />
                                        
                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="pagination__container">
                                                <div className="pagination__wrapper">
                                                    {/* Previous Button */}
                                                    <button
                                                        className={`pagination__btn pagination__prev ${currentPage === 1 ? 'disabled' : ''}`}
                                                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                    >
                                                        <i className="ri-arrow-left-s-line"></i>
                                                        Previous
                                                    </button>

                                                    {/* Page Numbers */}
                                                    <div className="pagination__numbers">
                                                        {currentPage > 3 && totalPages > 5 && (
                                                            <>
                                                                <button
                                                                    className="pagination__number"
                                                                    onClick={() => handlePageChange(1)}
                                                                >
                                                                    1
                                                                </button>
                                                                <span className="pagination__dots">...</span>
                                                            </>
                                                        )}

                                                        {generatePageNumbers().map(pageNumber => (
                                                            <button
                                                                key={pageNumber}
                                                                className={`pagination__number ${currentPage === pageNumber ? 'active' : ''}`}
                                                                onClick={() => handlePageChange(pageNumber)}
                                                            >
                                                                {pageNumber}
                                                            </button>
                                                        ))}

                                                        {currentPage < totalPages - 2 && totalPages > 5 && (
                                                            <>
                                                                <span className="pagination__dots">...</span>
                                                                <button
                                                                    className="pagination__number"
                                                                    onClick={() => handlePageChange(totalPages)}
                                                                >
                                                                    {totalPages}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Next Button */}
                                                    <button
                                                        className={`pagination__btn pagination__next ${currentPage === totalPages ? 'disabled' : ''}`}
                                                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                    >
                                                        Next
                                                        <i className="ri-arrow-right-s-line"></i>
                                                    </button>
                                                </div>

                                                {/* Page Info */}
                                                <div className="pagination__info">
                                                    <span>
                                                        Page {currentPage} in total of {totalPages} pages.
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </>
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
