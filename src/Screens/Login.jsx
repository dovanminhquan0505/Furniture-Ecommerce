import React from "react";
import "../styles/login.css";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import { Link } from "react-router-dom";

const Login = () => {
    return <Helmet title=" Login">
        <section>
            <Container>
                <Row>
                    <Col lg="6"></Col>
                </Row>
            </Container>
        </section>
    </Helmet>
};

export default Login;
