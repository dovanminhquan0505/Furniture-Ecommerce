import React, { useEffect, useState } from "react";
import { auth } from "../firebase.config";
import "../seller/styles/dashboard-seller.css";
import {
    Card,
    CardBody,
    CardText,
    CardTitle,
    Col,
    Container,
    Row,
    Spinner,
    Table,
} from "reactstrap";
import {
    CartesianGrid,
    Line,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    XAxis,
    YAxis,
    LineChart,
} from "../components/RechartsWrapper/RechartsWrapper";
import { getDashboardStats, getUserById } from "../api";

const DashboardSeller = () => {
    const [stats, setStats] = useState({
        dailyRevenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        productsSold: 0,
        profit: 0,
    });
    const [revenueData, setRevenueData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sellerId, setSellerId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSellerId = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
              toast.error("You must be logged in");
              navigate("/login");
              return;
            }

            const userData = await getUserById(currentUser.uid);
            setSellerId(userData.sellerId);
          };
          fetchSellerId();
    }, [navigate]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!sellerId) return;
            try {
              const data = await getDashboardStats(sellerId);
              setStats({
                dailyRevenue: data.dailyRevenue,
                weeklyRevenue: data.weeklyRevenue,
                monthlyRevenue: data.monthlyRevenue,
                orderCount: data.orderCount,
                profit: data.profit,
              });
              setRevenueData(data.revenueData);
              setTopProducts(data.topProducts);
            } catch (error) {
              toast.error("Error fetching stats: " + error.message);
            } finally {
              setLoading(false);
            }
          };
          fetchStats();
    }, [sellerId]);

    if (loading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner
                    style={{
                        width: "3rem",
                        height: "3rem",
                    }}
                />
                <span className="visually-hidden">Loading...</span>
            </Container>
        );
    }

    if (error) {
        return <div className="error__message">{error}</div>;
    }

    return (
        <Container className="dashboard__container">
            <Row>
                <Col md={4}>
                    <Card className="stats__card">
                        <CardBody>
                            <CardTitle tag="h5">Daily Revenue</CardTitle>
                            <CardText className="stat__value">
                                ${stats.dailyRevenue.toFixed(2)}
                            </CardText>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="stats__card">
                        <CardBody>
                            <CardTitle tag="h5">Weekly Revenue</CardTitle>
                            <CardText className="stat__value">
                                ${stats.weeklyRevenue.toFixed(2)}
                            </CardText>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="stats__card">
                        <CardBody>
                            <CardTitle tag="h5">Monthly Revenue</CardTitle>
                            <CardText className="stat__value">
                                ${stats.monthlyRevenue.toFixed(2)}
                            </CardText>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            <Row className="chart__row">
                <Col md={12}>
                    <Card className="chart__card">
                        <CardBody>
                            <CardTitle tag="h5">Revenue Trend</CardTitle>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#8884d8"
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <Card className="stats__card">
                        <CardBody>
                            <CardTitle tag="h5">Total Orders</CardTitle>
                            <CardText className="stat__value">
                                {stats.orderCount}
                            </CardText>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="stats__card">
                        <CardBody>
                            <CardTitle tag="h5">Estimated Profit</CardTitle>
                            <CardText className="stat__value">
                                ${stats.profit.toFixed(2)}
                            </CardText>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            <Row className="top-products__row">
                <Col md={12}>
                    <Card className="top-products__card">
                        <CardBody>
                            <CardTitle tag="h5">All Sold Products</CardTitle>
                            <Table responsive>
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Product Name</th>
                                        <th>Total Revenue</th>
                                        <th>Quantity Sold</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map((product, index) => (
                                        <tr key={index}>
                                            <td>
                                                <img
                                                    src={product.imgUrl || 'default-image.jpg'}
                                                    alt={product.product}
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                />
                                            </td>
                                            <td>{product.product}</td>
                                            <td>${product.totalRevenue.toFixed(2)}</td>
                                            <td>{product.totalQuantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default DashboardSeller;
