import React from "react";
import "../styles/pendingorders.css";
import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import { Button, Col, Container, Row, Spinner } from "reactstrap";
import useGetData from "../custom-hooks/useGetData";
import Helmet from "../components/Helmet/Helmet";

const PendingOrders = () => {
    const { data: pendingOrdersData, loading } = useGetData("pendingOrders");

    const handleApprove = async (order) => {
        try {
            // Generate a unique ID for the seller
            const sellerId = doc(collection(db, "sellers")).id;

            // Update approved order information to collection sellers
            await setDoc(doc(db, "sellers", sellerId), {
                fullName: order.fullName,
                phoneNumber: order.phoneNumber,
                email: order.email,
                storeName: order.storeName,
                storeDescription: order.storeDescription,
                businessType: order.businessType,
                address: order.address,
                city: order.city,
                storeEmail: order.storeEmail,
                role: "seller",
                status: "approved",
                createdAt: order.createdAt,
                approvedAt: new Date(),
            });

            // Find the user document by email
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", order.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Get the first (and should be only) document
                const userDoc = querySnapshot.docs[0];
                
                try {
                    await updateDoc(doc(db, "users", userDoc.id), {
                        status: "seller",
                        sellerId: sellerId
                    });
                    console.log("User document updated successfully");
                } catch (error) {
                    console.error("Error updating user document:", error);
                    throw error; 
                }
            } else {
                console.error("User document not found for email:", order.email);
                throw new Error("User not found");
            }

            await deleteDoc(doc(db, "pendingOrders", order.id));

            toast.success("Seller account approved and created successfully!");
        } catch (error) {
            toast.error("Error approving seller account: " + error.message);
        }
    };

    const handleReject = async (orderId) => {
        try {
            const pendingOrderRef = doc(db, "pendingOrders", orderId);
            await deleteDoc(pendingOrderRef);
            toast.success("Order rejected successfully!");
        } catch (error) {
            toast.error("Error rejecting order: ", error);
        }
    };

    return (
        <Helmet title=" Pending Orders">
            <Container className="pending-orders mt-5">
                <h2 className="text-center mb-4">Pending Orders</h2>
                {loading ? (
                    <Container
                        className="d-flex justify-content-center align-items-center"
                        style={{ height: "100vh" }}
                    >
                        <Spinner style={{ width: "3rem", height: "3rem" }} />
                        <span className="visually-hidden">Loading...</span>
                    </Container>
                ) : (
                    <>
                        {pendingOrdersData.length === 0 ? (
                            <p className="text-center">
                                No pending orders available.
                            </p>
                        ) : (
                            <Row>
                                {pendingOrdersData.map((order) => (
                                    <Col
                                        lg="6"
                                        md="12"
                                        key={order.id}
                                        className="mb-4"
                                    >
                                        <div className="order-card p-4">
                                            <h3 className="mb-3">
                                                {order.storeName}
                                            </h3>
                                            <Row>
                                                <Col xs="6">
                                                    <p>
                                                        <strong>
                                                            Full Name:
                                                        </strong>{" "}
                                                        {order.fullName}
                                                    </p>
                                                    <p>
                                                        <strong>Email:</strong>{" "}
                                                        {order.email}
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Store Email:
                                                        </strong>{" "}
                                                        {order.storeEmail}
                                                    </p>
                                                </Col>
                                                <Col xs="6">
                                                    <p>
                                                        <strong>Phone:</strong>{" "}
                                                        {order.phoneNumber}
                                                    </p>
                                                    <p>
                                                        <strong>City:</strong>{" "}
                                                        {order.city}
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Business Type:
                                                        </strong>{" "}
                                                        {order.businessType}
                                                    </p>
                                                </Col>
                                            </Row>
                                            <p>
                                                <strong>Address:</strong>{" "}
                                                {order.address}
                                            </p>
                                            <p>
                                                <strong>
                                                    Store Description:
                                                </strong>{" "}
                                                {order.storeDescription}
                                            </p>
                                            <p>
                                                <strong>Created At:</strong>{" "}
                                                {order.createdAt
                                                    .toDate()
                                                    .toString()}
                                            </p>
                                            <div className="d-flex justify-content-between mt-3">
                                                <Button
                                                    color="success"
                                                    onClick={() =>
                                                        handleApprove(order)
                                                    }
                                                >
                                                    ✔️ Approve
                                                </Button>
                                                <Button
                                                    color="danger"
                                                    onClick={() =>
                                                        handleReject(order.id)
                                                    }
                                                >
                                                    ❌ Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </>
                )}
            </Container>
        </Helmet>
    );
};

export default PendingOrders;
