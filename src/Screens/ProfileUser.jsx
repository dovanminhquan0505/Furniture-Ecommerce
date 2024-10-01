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
} from "lucide-react";
import "../styles/Profile.css";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase.config";
import { toast } from "react-toastify";
import { onAuthStateChanged } from "firebase/auth";

const ProfileUser = () => {
    const [activeSection, setActiveSection] = useState(null);
    const [editing, setEditing] = useState(false);
    const [userInfo, setUserInfo] = useState({
        displayName: "",
        birthDate: "",
        email: "",
        phone: "",
        address: "",
        role: "",
        photoURL: "",
    });

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

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserData(user);
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

    // Render personal Information
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

    const menuItems = [
        {
            icon: <User size={20} />,
            text: "Personal Information",
            content: renderPersonalInfo(),
        },
        {
            icon: <ShoppingCart size={20} />,
            text: "Order Information",
            content: (
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
                            <tr>
                                <td>001</td>
                                <td>2024-09-30</td>
                                <td>$100</td>
                                <td>2024-09-30</td>
                                <td>2024-10-05</td>
                                <td>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="action-button"
                                    >
                                        View
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        className="action-button"
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </div>
            ),
        },
        {
            icon: <Key size={20} />,
            text: "Change Password",
            content: (
                <div>
                    <h3>Change Your Password</h3>
                    <p>
                        Enter your current password and a new password to change
                        your login credentials.
                    </p>
                </div>
            ),
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
                        <h1 className="profile-name">{userInfo.displayName}</h1>
                        <p className="profile-role">{userInfo.role}</p>
                    </div>

                    <div className="sidebar-content">
                        <div className="menu-section">
                            <h2>Account Settings</h2>
                            {menuItems.map((item, index) => (
                                <div
                                    key={index}
                                    className={`menu-item ${
                                        activeSection === index ? "active" : ""
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
    );
};

export default ProfileUser;
