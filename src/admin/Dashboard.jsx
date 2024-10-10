import React from "react";
import { Container, Row, Col } from "reactstrap";
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
    const { data: products } = useGetData("products");
    const { data: users } = useGetData("users");
    const { data: orders } = useGetData("totalOrders");
    const { data: sellers } = useGetData("sellers");
    const { isDarkMode } = useTheme();

    // Calculate total revenue from paid orders only
    const totalSales = orders
        .filter((order) => order.isPaid !== false) // Filter paid orders
        .reduce((acc, order) => acc + order.totalPrice, 0); // Cumulative totalPrice of paid orders

    // Set Data for line chart
    const lineChartData = orders.map((order) => ({
        date: order.createdAt?.toDate().toLocaleDateString("en-US"),
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
                                    <span>{sellers.length}</span>
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
                                    <span>${totalSales}</span>
                                </div>
                            </Col>
                        </Row>

                        {/* Line Chart */}
                        <Row>
                            <Col lg="6" className="mt-5">
                                <h4 className="mb-3">Sales</h4>
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
                            </Col>

                            {/* Pie Chart */}
                            <Col lg="6" className="mt-5">
                                <h4 className="mb-2">Top Categories</h4>
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
                            </Col>
                        </Row>
                    </Container>
                </section>
            </Helmet>
        </>
    );
};

export default Dashboard;
