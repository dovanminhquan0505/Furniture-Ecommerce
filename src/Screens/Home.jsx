import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import products from "../assets/data/products";
import Helmet from "../components/Helmet/Helmet";
import heroImg from "../assets/images/hero-img.png";
import "../styles/home.css";
import { Container, Row, Col } from "reactstrap";
import Services from "../services/Services";
import ProductsList from "../components/UI/ProductsList";
import Clock from "../components/UI/Clock";
import counterImg from "../assets/images/counter-timer-img.png";

const Home = () => {
    //useEffect and useState are two very important hooks that allow us to manage state and side effects in functional components.
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [bestSalesProducts, setBestSalesProducts] = useState([]);
    const [mobileProducts, setMobileProducts] = useState([]);
    const [wirelessProducts, setWirelessProducts] = useState([]);
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
        const filteredMobileProducts = products.filter(
            (item) => item.category === "mobile"
        );
        const filteredWirelessProducts = products.filter(
            (item) => item.category === "wireless"
        );
        const filteredPopularProducts = products.filter(
            (item) => item.category === "watch"
        );

        //Update data
        setBestSalesProducts(filteredBestSalesProducts);
        setTrendingProducts(filteredTrendingProducts);
        setMobileProducts(filteredMobileProducts);
        setWirelessProducts(filteredWirelessProducts);
        setPopularProducts(filteredPopularProducts);
    }, []);

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
            <section className="trending__products">
                <Container>
                    <Row>
                        <Col lg="12" className="text-center">
                            <h2 className="section__title">
                                Trending Products
                            </h2>
                        </Col>
                        <ProductsList data={trendingProducts} />
                    </Row>
                </Container>
            </section>

            <section className="best__sales">
                <Container>
                    <Row>
                        <Col lg="12" className="text-center">
                            <h2 className="section__title">Best Sales</h2>
                        </Col>
                        <ProductsList data={bestSalesProducts} />
                    </Row>
                </Container>
            </section>

            <section className="timer__count">
                <Container>
                    <Row>
                        <Col lg="6" md="6">
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
                        <Col lg="6" md="6" className="text-end">
                            <img src={counterImg} alt="" />
                        </Col>
                    </Row>
                </Container>
            </section>

            <section className="new__arrivals">
                <Container>
                    <Row>
                        <Col lg="12" className="text-center mb-5">
                            <h2 className="section__title">New Arrivals</h2>
                        </Col>
                        <ProductsList data={mobileProducts} />
                        <ProductsList data={wirelessProducts} />
                    </Row>
                </Container>
            </section>

            <section className="popular_category">
                <Container>
                    <Row>
                        <Col lg="12" className="text-center mb-5">
                            <h2 className="section__title">Popular in Category</h2>
                        </Col>
                        <ProductsList data={popularProducts} />
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Home;
