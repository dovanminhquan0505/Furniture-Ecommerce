import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase.config";
import styles from "../seller/styles/dashboard-seller.css";
import { Card, CardBody, CardText, CardTitle, Col, Container, Row } from "reactstrap";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const DashboardSeller = () => {
    const [stats, setStats] = useState({
        dailyRevenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        productsSold: 0,
        profit: 0
    });
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect(() => {
    //     const fetchStats = async () => {
    //         try {
    //             const currentUser = auth.currentUser;
    //             if (!currentUser) {
    //                 setError("No authenticated user found. Please log in.");
    //                 setLoading(false);
    //                 return;
    //             }

    //             const sellerId = currentUser.uid;
    //             const ordersRef = collection(db, 'orders');
    //             const now = Timestamp.now();
    //             const dayAgo = Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);
    //             const weekAgo = Timestamp.fromMillis(now.toMillis() - 7 * 24 * 60 * 60 * 1000);
    //             const monthAgo = Timestamp.fromMillis(now.toMillis() - 30 * 24 * 60 * 60 * 1000);

    //             const q = query(
    //                 ordersRef,
    //                 where('sellerId', '==', sellerId),
    //                 where('createdAt', '>=', monthAgo)
    //             );

    //             const querySnapshot = await getDocs(q);
    //             let dailyRev = 0, weeklyRev = 0, monthlyRev = 0, productsSold = 0, totalProfit = 0;
    //             const revenueByDay = {};

    //             querySnapshot.forEach((doc) => {
    //                 const order = doc.data();
    //                 const orderDate = order.orderDate.toDate();
    //                 const revenue = order.totalAmount;
    //                 const profit = revenue * 0.2; // Assuming 20% profit margin

    //                 monthlyRev += revenue;
    //                 totalProfit += profit;
    //                 productsSold += order.items.reduce((acc, item) => acc + item.quantity, 0);

    //                 if (order.orderDate >= dayAgo) {
    //                     dailyRev += revenue;
    //                 }
    //                 if (order.orderDate >= weekAgo) {
    //                     weeklyRev += revenue;
    //                 }

    //                 const dateString = orderDate.toISOString().split('T')[0];
    //                 if (revenueByDay[dateString]) {
    //                     revenueByDay[dateString] += revenue;
    //                 } else {
    //                     revenueByDay[dateString] = revenue;
    //                 }
    //             });

    //             setStats({
    //                 dailyRevenue: dailyRev,
    //                 weeklyRevenue: weeklyRev,
    //                 monthlyRevenue: monthlyRev,
    //                 productsSold,
    //                 profit: totalProfit
    //             });

    //             const chartData = Object.keys(revenueByDay).map(date => ({
    //                 date,
    //                 revenue: revenueByDay[date]
    //             })).sort((a, b) => new Date(a.date) - new Date(b.date));

    //             setRevenueData(chartData);
    //             setLoading(false);
    //         } catch (err) {
    //             console.error("Error fetching stats:", err);
    //             setError("An error occurred while fetching your data. Please try again later.");
    //             setLoading(false);
    //         }
    //     };

    //     fetchStats();
    // }, []);

    if (loading) {
        return <div className={styles.loading__message}>Loading dashboard data...</div>;
    }

    if (error) {
        return <div className={styles.error__message}>{error}</div>;
    }

    return (
        <Container className={styles.dashboard__container}>
            <h2 className={styles.dashboard__title}>Seller Dashboard</h2>
            <Row>
                <Col md={4}>
                    <Card className={styles.stats__card}>
                        <CardBody>
                            <CardTitle tag="h5">Daily Revenue</CardTitle>
                            <CardText className={styles.stat__value}>${stats.dailyRevenue.toFixed(2)}</CardText>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className={styles.stats__card}>
                        <CardBody>
                            <CardTitle tag="h5">Weekly Revenue</CardTitle>
                            <CardText className={styles.stat__value}>${stats.weeklyRevenue.toFixed(2)}</CardText>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className={styles.stats__card}>
                        <CardBody>
                            <CardTitle tag="h5">Monthly Revenue</CardTitle>
                            <CardText className={styles.stat__value}>${stats.monthlyRevenue.toFixed(2)}</CardText>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            <Row className={styles.chart__row}>
                <Col md={12}>
                    <Card className={styles.chart__card}>
                        <CardBody>
                            <CardTitle tag="h5">Revenue Trend</CardTitle>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <Card className={styles.stats__card}>
                        <CardBody>
                            <CardTitle tag="h5">Products Sold</CardTitle>
                            <CardText className={styles.stat__value}>{stats.productsSold}</CardText>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className={styles.stats__card}>
                        <CardBody>
                            <CardTitle tag="h5">Estimated Profit</CardTitle>
                            <CardText className={styles.stat__value}>${stats.profit.toFixed(2)}</CardText>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default DashboardSeller;
