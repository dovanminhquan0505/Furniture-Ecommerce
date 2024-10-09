import React from "react";
import "../styles/pendingorders.css";
import {
    deleteDoc,
    doc,
    setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase.config";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Container, Spinner } from "reactstrap";
import useGetData from "../custom-hooks/useGetData";

const PendingOrders = () => {
    const {data: pendingOrdersData, loading} = useGetData("pendingOrders");

    const handleApprove = async (order) => {
        try {
            const adminUser = auth.currentUser;

            // Tạo người dùng trong Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                order.storeEmail,
                order.hashedPassword
            );

            const user = userCredential.user;

            // Cập nhật thông tin đơn hàng đã phê duyệt vào collection sellers
            await setDoc(doc(db, "sellers", user.uid), {
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

            await deleteDoc(doc(db, "pendingOrders", order.id));

            await auth.updateCurrentUser(adminUser);

            toast.success("Seller account approved and created successfully!");
        } catch (error) {
            console.error("Error approving seller account:", error);
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
        <div className="pending-orders">
            <h2>Pending Orders</h2>
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
                        <p>No pending orders available.</p>
                    ) : (
                        <ul>
                            {pendingOrdersData.map((order) => (
                                <li key={order.id}>
                                    <h3>{order.storeName}</h3>
                                    <p>
                                        <strong>Full Name:</strong> {order.fullName}
                                    </p>
                                    <p>
                                        <strong>Email:</strong> {order.email}
                                    </p>
                                    <p>
                                        <strong>Store Email:</strong> {order.storeEmail}
                                    </p>
                                    <p>
                                        <strong>Phone Number:</strong> {order.phoneNumber}
                                    </p>
                                    <p>
                                        <strong>Address:</strong> {order.address}
                                    </p>
                                    <p>
                                        <strong>City:</strong> {order.city}
                                    </p>
                                    <p>
                                        <strong>Business Type:</strong> {order.businessType}
                                    </p>
                                    <p>
                                        <strong>Store Description:</strong> {order.storeDescription}
                                    </p>
                                    <p>
                                        <strong>Created At:</strong> {order.createdAt.toDate().toString()}
                                    </p>
                                    <button
                                        className="approve-button"
                                        onClick={() => handleApprove(order)}
                                    >
                                        ✔️
                                    </button>
                                    <button
                                        className="reject-button"
                                        onClick={() => handleReject(order.id)}
                                    >
                                        ❌
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
};

export default PendingOrders;
