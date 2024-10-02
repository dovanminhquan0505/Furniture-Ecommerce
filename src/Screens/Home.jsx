import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Helmet from "../components/Helmet/Helmet";
import heroImg from "../assets/images/hero-img.png";
import "../styles/home.css";
import { Container, Row, Col } from "reactstrap";
import Services from "../services/Services";
import ProductsList from "../components/UI/ProductsList";
import Clock from "../components/UI/Clock";
import counterImg from "../assets/images/counter-timer-img.png";
import useGetData from "../custom-hooks/useGetData";
import { Spinner } from "react-bootstrap";

const Home = () => {
    const { data: products, loading } = useGetData("products");

    //useEffect and useState are two very important hooks that allow us to manage state and side effects in functional components.
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [bestSalesProducts, setBestSalesProducts] = useState([]);
    const [bedProducts, setBedProducts] = useState([]);
    const [televisionProducts, setTelevisionProducts] = useState([]);
    const [popularProducts, setPopularProducts] = useState([]);

    const year = new Date().getFullYear();

    //If this array is empty [], then useEffect will only be called once after the first render.
    useEffect(() => {
        const filteredTrendingProducts = products.filter(
            (item) => item.category === "chair"
        );
        const filteredBestSalesProducts = products.filter(
            (item) => item.category === "sofa"
        );
        const filteredBedProducts = products.filter(
            (item) => item.category === "bed"
        );
        const filteredTelevisionProducts = products.filter(
            (item) => item.category === "television"
        );
        const filteredPopularProducts = products.filter(
            (item) => item.category === "table"
        );

        //Update data
        setBestSalesProducts(filteredBestSalesProducts);
        setTrendingProducts(filteredTrendingProducts);
        setBedProducts(filteredBedProducts);
        setTelevisionProducts(filteredTelevisionProducts);
        setPopularProducts(filteredPopularProducts);
    }, [products]);

    return (
        <Helmet title={" Home"}>
            <section className="hero__section">
                <Container>
                    <Row>
                        <Col lg="6" md="6">
                            <div className="hero__content">
                                <p className="hero_subtitle">
                                    Trending Product In {year}
                                </p>
                                <h2>
                                    Make Your Interior More Minimalistic &
                                    Modern
                                </h2>
                                <p>
                                    Lorem ipsum dolor sit amet consectetur
                                    adipisicing elit. Nam, cum! Voluptatum
                                    praesentium quidem facilis maiores rerum
                                    animi necessitatibus? Corrupti, consectetur?
                                </p>
                                <motion.button
                                    // the button will scale to 120% of its size (scale: 1.2)
                                    whileTap={{ scale: 1.2 }}
                                    className="buy__btn"
                                >
                                    <Link to="/shop">SHOP NOW</Link>
                                </motion.button>
                            </div>
                        </Col>

                        <Col lg="6" md="6">
                            <div className="hero__img">
                                <img src={heroImg} alt="" />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            <Services />
            <section className="trending__products" id="chair">
                <Container>
                    <Row>
                        <Col lg="12" className="text-center">
                            <h2 className="section__title section__title-trending">
                                Trending Products
                            </h2>
                        </Col>
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
                        ) : (
                            <ProductsList data={trendingProducts} />
                        )}
                    </Row>
                </Container>
            </section>

            <section className="best__sales" id="sofa">
                <Container>
                    <Row>
                        <Col lg="12" className="text-center">
                            <h2 className="section__title">Best Sales</h2>
                        </Col>
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
                        ) : (
                            <ProductsList data={bestSalesProducts} />
                        )}
                    </Row>
                </Container>
            </section>

            <section className="timer__count">
                <Container>
                    <Row>
                        <Col lg="6" md="12" className="count__down-col">
                            <div className="clock__top-content">
                                <h4 className="text-white fs-6 mb-2">
                                    Limited Offers
                                </h4>
                                <h3 className="text-white fs-5 mb-3">
                                    Quality Arm Chair
                                </h3>
                            </div>
                            <Clock />

                            <motion.button
                                whileTap={{ scale: 1.2 }}
                                className="buy__btn store__btn"
                            >
                                <Link to="/shop">Visit Store</Link>
                            </motion.button>
                        </Col>
                        <Col lg="6" md="12" className="text-end counter__img">
                            <img src={counterImg} alt="" />
                        </Col>
                    </Row>
                </Container>
            </section>

            <section className="new__arrivals" id="bed">
                <Container>
                    <Row>
                        <Col lg="12" className="text-center mb-5">
                            <h2 className="section__title">New Arrivals</h2>
                        </Col>
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
                        ) : (
                            <ProductsList data={bedProducts} />
                        )}
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
                        ) : (
                            <ProductsList data={televisionProducts} />
                        )}
                    </Row>
                </Container>
            </section>

            <section className="popular_category" id="table">
                <Container>
                    <Row>
                        <Col lg="12" className="text-center mb-5">
                            <h2 className="section__title">
                                Popular in Category
                            </h2>
                        </Col>
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
                        ) : (
                            <ProductsList data={popularProducts} />
                        )}
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Home;
