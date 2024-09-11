import React from "react";
import Helmet from "../components/Helmet/Helmet";
import heroImg from '../assets/images/hero-img.png'
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
                                <button className="buy__btn">SHOP NOW</button>
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
