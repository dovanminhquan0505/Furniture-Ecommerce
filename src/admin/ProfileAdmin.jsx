import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Key,
    Bell,
    Globe,
    Moon,
    LogOut,
    ChevronRight,
} from "lucide-react";
import "../styles/Profile.css";
import { auth, db } from "../firebase.config";
import { toast } from "react-toastify";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ProfileAdmin = () => {
    const [activeSection, setActiveSection] = useState(null);
    const [editing, setEditing] = useState(false);
    //Set information for admin
    const [adminInfo, setAdminInfo] = useState({
        displayName: "",
        birthDate: "",
        email: "",
        phone: "",
        address: "",
        role: "",
        photoURL: "",
    });

    // Store original admin info for reset
    const [originalAdminInfo, setOriginalAdminInfo] = useState({
        ...adminInfo,
    });

    // Get admin data from firebase
    useEffect(() => {
        const fetchAdminData = async (user) => {
            try {
                if (user) {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const newAdminInfo = {
                            displayName: userData.displayName || "",
                            birthDate: userData.birthDate
                                ? new Date(userData.birthDate.toDate())
                                      .toISOString()
                                      .split("T")[0]
                                : "",
                            email: userData.email || user.email,
                            phone: userData.phone || "",
                            address: userData.address || "",
                            role: userData.role || "admin",
                            photoURL: userData.photoURL || "",
                        };
                        setAdminInfo(newAdminInfo);
                        setOriginalAdminInfo(newAdminInfo);
                    }
                } else {
                    toast.error("User document not found in Firestore!");
                }
            } catch (error) {
                toast.error("Fetch failed for user: " + error.message);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchAdminData(user);
            } else {
                toast.error("User not found!");
            }
        });

        return () => unsubscribe();
    }, []);

    // Handle Edit profile admin
    const handleEditProfile = async () => {
        const user = auth.currentUser;
        if (user) {
            const userDocRef = doc(db, "users", user.uid);

            try {
                await updateDoc(userDocRef, {
                    displayName: adminInfo.displayName,
                    birthDate: new Date(adminInfo.birthDate),
                    phone: adminInfo.phone,
                    address: adminInfo.address,
                });

                toast.success("Profile updated successfully!");
                setEditing(false);
            } catch (error) {
                toast.error("Failed to update profile: " + error.message);
            }
        }
    };

    // Handle Input change when user changes their information
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAdminInfo((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Cancel edit and revert changes
    const handleCancelEdit = () => {
        // Revert to original info
        setAdminInfo(originalAdminInfo);
        setEditing(false);
    };

    // Render profile admin
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
                            value={adminInfo.displayName}
                            onChange={handleInputChange}
                        />
                    ) : (
                        adminInfo.displayName || "Not Provided"
                    )}
                </span>
            </div>
            <div className="info-item">
                <Calendar size={18} />
                <span>
                    <strong>Date of Birth:</strong>{" "}
                    {editing ? (
                        <input
                            type="date"
                            name="birthDate"
                            value={adminInfo.birthDate}
                            onChange={handleInputChange}
                        />
                    ) : (
                        adminInfo.birthDate || "Not Provided"
                    )}
                </span>
            </div>
            <div className="info-item">
                <Mail size={18} />
                <span>
                    <strong>Email:</strong> {adminInfo.email}
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
                            value={adminInfo.phone}
                            onChange={handleInputChange}
                        />
                    ) : (
                        adminInfo.phone || "Not Provided"
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
                            value={adminInfo.address}
                            onChange={handleInputChange}
                        />
                    ) : (
                        adminInfo.address || "Not Provided"
                    )}
                </span>
            </div>
            <Button
                variant="primary"
                className="edit-profile-button"
                onClick={() =>
                    editing ? handleEditProfile() : setEditing(true)
                }
            >
                {editing ? "Save changes" : "Edit Profile"}
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
                                    adminInfo.photoURL ||
                                    "https://via.placeholder.com/150"
                                }
                                alt="Admin Avatar"
                            />
                        </div>
                        <h1 className="profile-name">
                            {adminInfo.displayName}
                        </h1>
                        <p className="profile-role">{adminInfo.role}</p>
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

export default ProfileAdmin;
