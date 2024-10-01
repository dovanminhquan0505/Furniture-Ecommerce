import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Table } from "react-bootstrap";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Key,
    Bell,
    Globe,
    Moon,
    LogOut,
    ChevronRight,
    ShoppingCart,
    Calendar,
    Eye,
    EyeOff,
} from "lucide-react";
import "../styles/Profile.css";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { auth, db } from "../firebase.config";
import { toast } from "react-toastify";
import {
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";

const ProfileUser = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(null);
    const [editing, setEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [userInfo, setUserInfo] = useState({
        displayName: "",
        birthDate: "",
        email: "",
        phone: "",
        address: "",
        role: "",
        photoURL: "",
    });

    const [orderInfo, setOrderInfo] = useState([]);

    const [originalUserInfo, setOriginalUserInfo] = useState({ ...userInfo });

    useEffect(() => {
        const fetchUserData = async (user) => {
            try {
                if (user) {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const newUserInfo = {
                            displayName: userData.displayName || "",
                            birthDate: userData.birthDate
                                ? new Date(userData.birthDate.toDate())
                                      .toISOString()
                                      .split("T")[0]
                                : "",
                            email: userData.email,
                            phone: userData.phone || "",
                            address: userData.address || "",
                            role: userData.role || "user",
                            photoURL: userData.photoURL || "",
                        };
                        setUserInfo(newUserInfo);
                        setOriginalUserInfo(newUserInfo);
                    } else {
                        toast.error("User document not found in Firestore!");
                    }
                }
            } catch (error) {
                toast.error("Fetch failed for user: " + error.message);
            }
        };

        const fetchOrderData = async (userId) => {
            if (!userId) {
                toast.error("User ID is undefined!");
                return;
            }

            try {
                // Use query to filter orders by userId
                const ordersQuery = query(
                    collection(db, "orders"),
                    where("userId", "==", userId)
                );
                const orderDocs = await getDocs(ordersQuery);
                const orders = [];

                orderDocs.forEach((doc) => {
                    const orderData = doc.data();
                    orders.push({
                        orderId: doc.id || "No ID",
                        date: orderData.createdAt
                            .toDate()
                            .toISOString()
                            .split("T")[0],
                        totalPrice: orderData.totalPrice,
                        paidAt: orderData.isPaid
                            ? orderData.paidAt
                                  .toDate()
                                  .toISOString()
                                  .split("T")[0]
                            : "No",
                        deliveredAt: orderData.isDelivered
                            ? orderData.deliveredAt
                                  .toDate()
                                  .toISOString()
                                  .split("T")[0]
                            : "No",
                    });
                });

                // Update the state with the fetched orders
                setOrderInfo(orders);
            } catch (error) {
                toast.error(
                    "Failed to get order document from Firestore: " +
                        error.message
                );
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserData(user);
                fetchOrderData(user.uid);
            } else {
                toast.error("User not found!");
            }
        });

        return () => unsubscribe();
    }, []);

    // Handle Edit Profile
    const handleEditUserProfile = async () => {
        const user = auth.currentUser;
        if (user) {
            const userDocRef = doc(db, "users", user.uid);

            try {
                await updateDoc(userDocRef, {
                    displayName: userInfo.displayName,
                    birthDate: new Date(userInfo.birthDate),
                    phone: userInfo.phone,
                    address: userInfo.address,
                });

                toast.success("Updated Profile Successfully!");
                setEditing(false);
            } catch (error) {
                toast.error("Failed to update Profile: " + error.message);
            }
        }
    };

    const handleInputChanges = (e) => {
        const { name, value } = e.target;
        setUserInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleCancelEdit = () => {
        setUserInfo(originalUserInfo);
        setEditing(false);
    };

    const handleViewOrder = (orderId) => {
        navigate(`/placeorder/${orderId}`);
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            const orderDocRef = doc(db, "orders", orderId);
            await deleteDoc(orderDocRef);

            // Update state list of orders after deleting order
            setOrderInfo((prevOrders) =>
                prevOrders.filter((order) => order.orderId !== orderId)
            );
            toast.success("Order deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete order: " + error.message);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const currentPassword = e.target.currentPassword.value;
        const newPassword = e.target.newPassword.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error("No authenticated user found!");
                return;
            }

            // Create credential to re-authenticate user
            const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            // Re-authenticate user with the credential
            await reauthenticateWithCredential(user, credential);

            // Update new password
            await updatePassword(user, newPassword);
            toast.success("Password updated successfully!");

            // Reset input fields after successful password change
            e.target.reset();
        } catch (error) {
            if (error.code === "auth/wrong-password") {
                toast.error("Incorrect current password. Please try again.");
            } else if (error.code === "auth/invalid-credential") {
                toast.error("Invalid credentials. Please check your input.");
            } else {
                toast.error("Failed to change password: " + error.message);
            }
        }
    };

    // Render Personal Information
    const renderPersonalInfo = () => (
        <div className="personal-info">
            <h3>Personal Information</h3>
            <div className="info-item">
                <User size={18} />
                <span>
                    <strong>Name:</strong>
                    {editing ? (
                        <input
                            type="text"
                            name="displayName"
                            value={userInfo.displayName}
                            onChange={handleInputChanges}
                        />
                    ) : (
                        userInfo.displayName || "Not Provided"
                    )}
                </span>
            </div>
            <div className="info-item">
                <Calendar size={18} />
                <span>
                    <strong>BirthDate:</strong>
                    {editing ? (
                        <input
                            type="date"
                            name="birthDate"
                            value={userInfo.birthDate}
                            onChange={handleInputChanges}
                        />
                    ) : (
                        userInfo.birthDate || "Not Provided"
                    )}
                </span>
            </div>
            <div className="info-item">
                <Mail size={18} />
                <span>
                    <strong>Email:</strong> {userInfo.email}
                </span>
            </div>
            <div className="info-item">
                <Phone size={18} />
                <span>
                    <strong>Phone:</strong>
                    {editing ? (
                        <input
                            type="text"
                            name="phone"
                            value={userInfo.phone}
                            onChange={handleInputChanges}
                        />
                    ) : (
                        userInfo.phone || "Not Provided"
                    )}
                </span>
            </div>
            <div className="info-item last">
                <MapPin size={18} />
                <span>
                    <strong>Address:</strong>
                    {editing ? (
                        <input
                            type="text"
                            name="address"
                            value={userInfo.address}
                            onChange={handleInputChanges}
                        />
                    ) : (
                        userInfo.address || "Not Provided"
                    )}
                </span>
            </div>
            <Button
                variant="primary"
                className="edit-profile-button"
                onClick={() =>
                    editing ? handleEditUserProfile() : setEditing(true)
                }
            >
                {editing ? "Save Changes" : "Edit Profile"}
            </Button>
            {editing && (
                <Button
                    variant="secondary"
                    className="cancel-edit-button"
                    onClick={handleCancelEdit}
                >
                    Back
                </Button>
            )}
        </div>
    );

    // Render Order Information
    const renderOrderInformation = () => (
        <div className="order-info">
            <h3>Your Orders</h3>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Total Price</th>
                        <th>Paid At</th>
                        <th>Delivered At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orderInfo.length > 0 ? (
                        orderInfo.map((order) => (
                            <tr key={order.orderId}>
                                <td>{order.orderId}</td>
                                <td>{order.date}</td>
                                <td>${order.totalPrice}</td>
                                <td>{order.paidAt}</td>
                                <td>{order.deliveredAt}</td>
                                <td>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="action-button"
                                        onClick={() =>
                                            handleViewOrder(order.orderId)
                                        }
                                    >
                                        View
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        className="action-button"
                                        onClick={() =>
                                            handleDeleteOrder(order.orderId)
                                        }
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">
                                No orders found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );

    // Render Change Password
    const renderChangePassword = () => (
        <div className="change-password">
            <h3>Change Password</h3>
            <p>
                For your account's security, do not share your password with anyone else.
            </p>
            <form className="change-password-form" onSubmit={handleChangePassword}>
                <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="currentPassword"
                            className="form-control"
                            placeholder="Enter current password"
                            required
                        />
                        <span
                            className="toggle-password-visibility"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </span>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="newPassword"
                            className="form-control"
                            placeholder="Enter new password"
                            required
                        />
                        <span
                            className="toggle-password-visibility"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </span>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="confirmPassword"
                            className="form-control"
                            placeholder="Re-enter new password"
                            required
                        />
                        <span
                            className="toggle-password-visibility"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </span>
                    </div>
                </div>
                <Button type="submit" variant="primary" className="change-password-button">
                    Save Changes
                </Button>
            </form>
        </div>
    );

    const menuItems = [
        {
            icon: <User size={20} />,
            text: "Personal Information",
            content: renderPersonalInfo(),
        },
        {
            icon: <ShoppingCart size={20} />,
            text: "Order Information",
            content: renderOrderInformation(),
        },
        {
            icon: <Key size={20} />,
            text: "Change Password",
            content: renderChangePassword(),
        },
        {
            icon: <Bell size={20} />,
            text: "Notifications",
            content: (
                <div>
                    <h3>Notification Settings</h3>
                    <p>Manage your email and push notification preferences.</p>
                </div>
            ),
        },
        {
            icon: <Globe size={20} />,
            text: "Language",
            content: (
                <div>
                    <h3>Language Preferences</h3>
                    <p>
                        Select your preferred language for the admin interface.
                    </p>
                </div>
            ),
        },
        {
            icon: <Moon size={20} />,
            text: "Dark Mode",
            content: (
                <div>
                    <h3>Display Settings</h3>
                    <p>
                        Toggle between light and dark mode for the admin panel.
                    </p>
                </div>
            ),
        },
        {
            icon: <LogOut size={20} />,
            text: "Logout",
            content: (
                <div>
                    <h3>Logout</h3>
                    <p>Are you sure you want to log out of the admin panel?</p>
                    <Button variant="danger">Logout</Button>
                </div>
            ),
        },
    ];

    return (
        <Helmet title=" Profile">
            <Container fluid className="profile__personal">
                <Row>
                    <Col md={12} className="sidebar">
                        <div className="profile-header">
                            <div className="profile-avatar">
                                <img
                                    src={
                                        userInfo.photoURL ||
                                        "https://via.placeholder.com/150"
                                    }
                                    alt="Admin Avatar"
                                />
                            </div>
                            <h1 className="profile-name">
                                {userInfo.displayName}
                            </h1>
                            <p className="profile-role">{userInfo.role}</p>
                        </div>

                        <div className="sidebar-content">
                            <div className="menu-section">
                                <h2>Account Settings</h2>
                                {menuItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`menu-item ${
                                            activeSection === index
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() => setActiveSection(index)}
                                    >
                                        {item.icon}
                                        <span>{item.text}</span>
                                        <ChevronRight size={20} />
                                    </div>
                                ))}
                            </div>

                            <div className="main-content">
                                {activeSection !== null && (
                                    <div className="content-area">
                                        {menuItems[activeSection].content}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </Helmet>
    );
};

export default ProfileUser;
