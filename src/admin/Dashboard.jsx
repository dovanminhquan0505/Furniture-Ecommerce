import React, { useEffect, useState } from "react";
import { Container, Row, Col, Spinner } from "reactstrap";
import "../styles/dashboard.css";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { useTheme } from "../components/UI/ThemeContext";
import Helmet from "../components/Helmet/Helmet";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import { getDashboardDataAdmin } from "../api";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        products: [],
        users: [],
        orders: [],
        sellers: [],
    });
    const [loading, setLoading] = useState(true);
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const reduxUser = useSelector((state) => state.user.currentUser);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const user = auth.currentUser;
            if (!user) {
                toast.error("Unauthorized! Please log in again.");
                return;
            }

            if (!reduxUser || reduxUser.role !== "admin") {
                toast.error("You must be an admin to access this page");
                navigate("/login");
                return;
            }

            try {
                const data = await getDashboardDataAdmin();
                setDashboardData(data);
            } catch (error) {
                toast.error("Failed to fetch dashboard data: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate, reduxUser]);

    // Format date function to handle different date formats
    const formatDate = (date) => {
        if (!date) return "Unknown";
        return new Date(date).toLocaleDateString("en-US");
    };

    // Set Data for line chart
    const lineChartData = dashboardData.orders.map((order) => ({
        date: formatDate(order.createdAt),
        sales: order.totalPrice,
    }));

    // Get category data for pie chart based on paidAt
    const categoryData = dashboardData.orders.reduce((acc, order) => {
        if (order.paidAt && Array.isArray(order.cartItems)) {
            order.cartItems.forEach((item) => {
                const category = item.category || "Unknown";
                acc[category] = (acc[category] || 0) + item.quantity;
            });
        }
        return acc;
    }, {});

    // Set Data for pie chart
    const pieChartData = Object.keys(categoryData).map((category) => ({
        name: category,
        value: categoryData[category],
    }));

    // Set colors for chart
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#FF0000"];

    if (loading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">
                        Loading dashboard data...
                    </span>
                </Spinner>
            </Container>
        );
    }

    return (
        <>
            <Helmet title=" Dashboard">
                <section
                    className={`${isDarkMode ? "dark-mode" : "light-mode"}`}
                >
                    <Container>
                        <Row>
                            <Col lg="3">
                                <div className="orders__box">
                                    <h5>Sellers</h5>
                                    <span>{dashboardData.sellers.length}</span>
                                </div>
                            </Col>
                            <Col lg="3">
                                <div className="products__box">
                                    <h5>Products</h5>
                                    <span>{dashboardData.products.length}</span>
                                </div>
                            </Col>
                            <Col lg="3">
                                <div className="users__box">
                                    <h5>Users</h5>
                                    <span>{dashboardData.users.length}</span>
                                </div>
                            </Col>
                            <Col lg="3">
                                <div className="revenue__box">
                                    <h5>Orders</h5>
                                    <span>{dashboardData.orders.length}</span>
                                </div>
                            </Col>
                        </Row>

                        {/* Line Chart */}
                        <Row>
                            <Col lg="6" className="mt-5">
                                <h4 className="mb-3">Sales</h4>
                                {lineChartData.length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={300}
                                    >
                                        <LineChart data={lineChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="sales"
                                                stroke="#ff7300"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center py-5">
                                        <p>No sales data available</p>
                                    </div>
                                )}
                            </Col>

                            {/* Pie Chart */}
                            <Col lg="6" className="mt-5">
                                <h4 className="mb-2">Top Categories</h4>
                                {pieChartData.length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={300}
                                    >
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name }) => name}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieChartData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                COLORS[
                                                                    index %
                                                                        COLORS.length
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center py-5">
                                        <p>No category data available</p>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </Container>
                </section>
            </Helmet>
        </>
    );
};

export default Dashboard;
