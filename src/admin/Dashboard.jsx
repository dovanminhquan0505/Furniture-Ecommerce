import React from "react";
import { Container, Row, Col, Spinner } from "reactstrap";
import "../styles/dashboard.css";
import useGetData from "../custom-hooks/useGetData";
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

const Dashboard = () => {
    const {
        data: products,
        loading: loadingProducts,
        error: productsError,
    } = useGetData("products");
    const {
        data: users,
        loading: loadingUsers,
        error: usersError,
    } = useGetData("users");
    const {
        data: orders,
        loading: loadingOrders,
        error: ordersError,
    } = useGetData("totalOrders");
    const {
        data: sellers,
        loading: loadingSellers,
        error: sellersError,
    } = useGetData("sellers");
    const { isDarkMode } = useTheme();

    // Format date function to handle different date formats
    const formatDate = (createdAt) => {
        if (!createdAt) return "Unknown";

        if (typeof createdAt.toDate === "function") {
            return createdAt.toDate().toLocaleDateString("en-US");
        }

        if (createdAt instanceof Date) {
            return createdAt.toLocaleDateString("en-US");
        }

        if (typeof createdAt === "number") {
            return new Date(createdAt).toLocaleDateString("en-US");
        }

        if (typeof createdAt === "string") {
            return new Date(createdAt).toLocaleDateString("en-US");
        }

        return "Unknown";
    };

    // Set Data for line chart
    const lineChartData = orders.map((order) => ({
        date: formatDate(order.createdAt),
        sales: order.totalPrice,
    }));

    // Get category data for pie chart based on paidAt
    const categoryData = orders.reduce((acc, order) => {
        if (order.paidAt) {
            order.cartItems.forEach((item) => {
                const category = item.category || "Unknown";
                if (!acc[category]) {
                    acc[category] = 0;
                }
                acc[category] += item.quantity;
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

    // Check if any data is loading
    const isLoading =
        loadingProducts || loadingUsers || loadingOrders || loadingSellers;

    // Check for errors
    const hasError = productsError || usersError || ordersError || sellersError;

    if (isLoading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading dashboard data...</span>
                </Spinner>
            </Container>
        );
    }

    if (hasError) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center flex-column"
                style={{ height: "100vh" }}
            >
                <h3 className="text-danger mb-3">Error Loading Dashboard</h3>
                <p>There was a problem loading the dashboard data. Please check your connection and try again.</p>
                {productsError && <p>Products error: {productsError}</p>}
                {usersError && <p>Users error: {usersError}</p>}
                {ordersError && <p>Orders error: {ordersError}</p>}
                {sellersError && <p>Sellers error: {sellersError}</p>}
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
                                    <span>{Array.isArray(sellers) ? sellers.length : 0}</span>
                                </div>
                            </Col>
                            <Col lg="3">
                                <div className="products__box">
                                    <h5>Products</h5>
                                    <span>{Array.isArray(products) ? products.length : 0}</span>
                                </div>
                            </Col>
                            <Col lg="3">
                                <div className="users__box">
                                    <h5>Users</h5>
                                    <span>{Array.isArray(users) ? users.length : 0}</span>
                                </div>
                            </Col>
                            <Col lg="3">
                                <div className="revenue__box">
                                    <h5>Orders</h5>
                                    <span>{Array.isArray(orders) ? orders.length : 0}</span>
                                </div>
                            </Col>
                        </Row>

                        {/* Line Chart */}
                        <Row>
                            <Col lg="6" className="mt-5">
                                <h4 className="mb-3">Sales</h4>
                                {lineChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
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
                                    <ResponsiveContainer width="100%" height={300}>
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
