import React from "react";
import "../Footer/footer.css";
import { Container, Row, Col, ListGroup, ListGroupItem } from "reactstrap";

const Footer = () => {
    const year = new Date().getFullYear();
    return (
        <footer className="footer">
            <Container>
                <Row>
                    <Col lg="4" md="6" className="mb-4">
                        <div className="logo">
                            <div>
                                <h1 className="text-white">Multimart</h1>
                            </div>
                        </div>
                        <p className="footer__text mt-4">
                            Lorem ipsum dolor sit amet, consectetur adipisicing
                            elit. Ex perspiciatis laudantium a accusantium,
                            doloribus assumenda fugiat omnis delectus voluptas
                            odio.
                        </p>
                    </Col>

                    <Col lg="3" md="3" className="mb-4">
                        <div className="footer__quick-links">
                            <h4 className="quick__links-title">
                                Top Categories
                            </h4>
                            <ListGroup>
                                <ListGroupItem className="ps-0 border-0">
                                    <a href="#table">Popular Table</a>
                                </ListGroupItem>

                                <ListGroupItem className="ps-0 border-0">
                                    <a href="#sofa">Modern sofa</a>
                                </ListGroupItem>

                                <ListGroupItem className="ps-0 border-0">
                                    <a href="#chair">Arm chair</a>
                                </ListGroupItem>

                                <ListGroupItem className="ps-0 border-0">
                                    <a href="#bed">Single-Couple bed</a>
                                </ListGroupItem>
                            </ListGroup>
                        </div>
                    </Col>

                    <Col lg="2" md="3" className="mb-4">
                        <div className="footer__quick-links">
                            <h4 className="quick__links-title">Useful Links</h4>
                            <ListGroup>
                                <ListGroupItem className="ps-0 border-0">
                                    <a href="/shop">Shop</a>
                                </ListGroupItem>

                                <ListGroupItem className="ps-0 border-0">
                                    <a href="/cart">Cart</a>
                                </ListGroupItem>

                                <ListGroupItem className="ps-0 border-0">
                                    <a href="/login">Login</a>
                                </ListGroupItem>

                                <ListGroupItem className="ps-0 border-0">
                                    <a href="/#">Privacy Policy</a>
                                </ListGroupItem>
                            </ListGroup>
                        </div>
                    </Col>

                    <Col lg="3" md="4">
                        <div className="footer__quick-links">
                            <h4 className="quick__links-title">Contact</h4>
                            <ListGroup className="footer__contact">
                                <ListGroupItem className="ps-0 border-0 d-flex align-items-center gap-2">
                                    <span>
                                        <i className="ri-map-pin-line"></i>
                                    </span>
                                    <p>123 Hoàng Văn Thụ, P7, Quận 1, TPHCM</p>
                                </ListGroupItem>

                                <ListGroupItem className="ps-0 border-0 d-flex align-items-center gap-2">
                                    <span>
                                        <i className="ri-phone-line"></i>
                                    </span>
                                    <p>0123456789</p>
                                </ListGroupItem>

                                <ListGroupItem className="ps-0 border-0 d-flex align-items-center gap-2">
                                    <span>
                                        <i className="ri-mail-line"></i>
                                    </span>
                                    <p>multimart@gmail.com</p>
                                </ListGroupItem>
                            </ListGroup>
                        </div>
                    </Col>

                    <Col lg="12">
                        <p className="footer__copyright">
                            Copyright {year} developed by Minh Quan. All rights
                            reserved.
                        </p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;
