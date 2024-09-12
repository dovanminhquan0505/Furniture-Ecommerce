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

const Home = () => {
    //useEffect and useState are two very important hooks that allow us to manage state and side effects in functional components.
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [bestSalesProducts, setBestSalesProducts] = useState([]);

    const year = new Date().getFullYear();

    //If this array is empty [], then useEffect will only be called once after the first render.
    useEffect(() => {
        const filteredTrendingProducts = products.filter(
            (item) => item.category === "chair"
        );
        const filteredBestSalesProducts = products.filter(
            (item) => item.category === "sofa"
        );

        //Update data
        setBestSalesProducts(filteredBestSalesProducts);
        setTrendingProducts(filteredTrendingProducts);
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
        </Helmet>
    );
};

export default Home;
