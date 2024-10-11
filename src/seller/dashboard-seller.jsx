import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    Timestamp,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase.config";
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
import { format } from "date-fns";

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
        const fetchSellerData = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("You must be logged in to view your products");
                navigate("/login");
                return;
            }

            const userDocRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setSellerId(userData.sellerId);
            } else {
                toast.error("User not found");
                navigate("/register");
            }
        };

        fetchSellerData();
    }, [navigate]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!sellerId) {
                return;
            }

            try {
                setLoading(true);

                const totalOrdersRef = collection(db, "totalOrders");
                const subOrdersRef = collection(db, "subOrders");
                const now = Timestamp.now();
                const dayAgo = Timestamp.fromMillis(
                    now.toMillis() - 24 * 60 * 60 * 1000
                );
                const weekAgo = Timestamp.fromMillis(
                    now.toMillis() - 7 * 24 * 60 * 60 * 1000
                );
                const monthAgo = Timestamp.fromMillis(
                    now.toMillis() - 30 * 24 * 60 * 60 * 1000
                );

                const totalOrdersQuery = query(
                    totalOrdersRef,
                    where("sellerIds", "array-contains", sellerId),
                    where("createdAt", ">=", monthAgo)
                );

                const subOrdersQuery = query(
                    subOrdersRef,
                    where("sellerId", "==", sellerId),
                    where("createdAt", ">=", monthAgo)
                );

                const [totalOrdersSnapshot, subOrdersSnapshot] =
                    await Promise.all([
                        getDocs(totalOrdersQuery),
                        getDocs(subOrdersQuery),
                    ]);

                let dailyRev = 0,
                    weeklyRev = 0,
                    monthlyRev = 0,
                    orderCount = 0,
                    totalProfit = 0;
                const revenueByDay = {};
                const productSales = {};

                totalOrdersSnapshot.forEach((doc) => {
                    const order = doc.data();
                    const orderDate = order.createdAt.toDate();
                    const sellerCount = order.sellerIds.length;
                    const revenue = order.totalAmount / sellerCount;
                    const profit = revenue * 0.2; // Assuming 20% profit margin

                    monthlyRev += revenue;
                    totalProfit += profit;
                    orderCount++;

                    if (order.createdAt.toDate() >= dayAgo.toDate()) {
                        dailyRev += revenue;
                    }
                    if (order.createdAt.toDate() >= weekAgo.toDate()) {
                        weeklyRev += revenue;
                    }

                    const dateString = orderDate.toISOString().split("T")[0];
                    if (revenueByDay[dateString]) {
                        revenueByDay[dateString] += revenue;
                    } else {
                        revenueByDay[dateString] = revenue;
                    }
                });

                subOrdersSnapshot.forEach((doc) => {
                    const subOrder = doc.data();
                    if (subOrder.product && subOrder.quantity) {
                        if (productSales[subOrder.product]) {
                            productSales[subOrder.product] += subOrder.quantity;
                        } else {
                            productSales[subOrder.product] = subOrder.quantity;
                        }
                    }
                });

                setStats({
                    dailyRevenue: dailyRev,
                    weeklyRevenue: weeklyRev,
                    monthlyRevenue: monthlyRev,
                    orderCount,
                    profit: totalProfit,
                });

                const chartData = Object.entries(revenueByDay).map(
                    ([date, revenue]) => {
                        const timestamp = new Date(date).getTime();
                        console.log(`Date: ${date}, Timestamp: ${timestamp}`);
                        return {
                            date: timestamp,
                            revenue: parseFloat(revenue.toFixed(2)),
                        };
                    }
                );

                const sortedChartData = chartData.sort(
                    (a, b) => a.date - b.date
                );
                console.log("Sorted chart data:", sortedChartData); // Debug log
                setRevenueData(sortedChartData);

                const sortedProducts = Object.entries(productSales)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([product, quantity]) => ({ product, quantity }));

                setTopProducts(sortedProducts);

                setLoading(false);
            } catch (err) {
                console.error("Error fetching stats:", err);
                setError(
                    "An error occurred while fetching your data. Please try again later."
                );
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
                            <CardTitle tag="h5">Top 5 Products</CardTitle>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity Sold</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map((product, index) => (
                                        <tr key={index}>
                                            <td>{product.product}</td>
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
