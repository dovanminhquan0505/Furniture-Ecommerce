import React from "react";
import { Container, Row, Col } from "reactstrap";
import "../styles/dashboard.css";
import useGetData from "../custom-hooks/useGetData";

const Dashboard = () => {
    const {data: products} = useGetData('products');
    const {data: users} = useGetData('users');

    return (
        <>
            <section>
                <Container>
                    <Row>
                        <Col lg="3">
                            <div className="orders__box">
                                <h5>Orders</h5>
                                <span>789</span>
                            </div>
                        </Col>
                        <Col lg="3">
                            <div className="products__box">
                                <h5>Products</h5>
                                <span>{products.length}</span>
                            </div>
                        </Col>
                        <Col lg="3">
                            <div className="users__box">
                                <h5>Users</h5>
                                <span>{users.length}</span>
                            </div>
                        </Col>
                        <Col lg="3">
                            <div className="revenue__box">
                                <h5>Total Sales</h5>
                                <span>$7890</span>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default Dashboard;
