import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Helmet from "../components/Helmet/Helmet";
import heroImg from "../assets/images/hero-img.png";
import "../styles/home.css";
import { Container, Row, Col } from "reactstrap";

const Home = () => {
    const year = new Date().getFullYear();
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
        </Helmet>
    );
};

export default Home;
