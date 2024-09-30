import React, { useState } from "react";
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
import "../styles/ProfileAdmin.css";

const emailAdmin = process.env.REACT_APP_FURNITURE_ECOMMERCE_ADMIN_EMAIL;

const AdminProfile = () => {
    const [activeSection, setActiveSection] = useState(null);

    const adminInfo = {
        name: "Minh Wuan",
        birthDate: "May 05, 2003",
        email: emailAdmin,
        phone: "+84 0964321553",
        address: "123 Hoàng Văn Thụ, P7, Quận 1, TPHCM",
        role: "Admin",
    };

    const menuItems = [
        {
            icon: <User size={20} />,
            text: "Personal Information",
            content: (
                <div className="personal-info">
                    <h3>Personal Information</h3>
                    <div className="info-item">
                        <User size={18} />
                        <span><strong>Name:</strong> {adminInfo.name}</span>
                    </div>
                    <div className="info-item">
                        <Calendar size={18} />
                        <span><strong>Date of Birth:</strong> {adminInfo.birthDate}</span>
                    </div>
                    <div className="info-item">
                        <Mail size={18} />
                        <span><strong>Email:</strong> {adminInfo.email}</span>
                    </div>
                    <div className="info-item">
                        <Phone size={18} />
                        <span><strong>Phone:</strong> {adminInfo.phone}</span>
                    </div>
                    <div className="info-item">
                        <MapPin size={18} />
                        <span><strong>Address:</strong> {adminInfo.address}</span>
                    </div>
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
        <Container fluid className="admin-profile">
            <Row>
                <Col md={12} className="sidebar">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            <img
                                src="https://via.placeholder.com/150"
                                alt="Admin Avatar"
                            />
                        </div>
                        <h1 className="profile-name">{adminInfo.name}</h1>
                        <p className="profile-role">{adminInfo.role}</p>
                    </div>

                    <div className="sidebar-content">
                        {/* Menu Section */}
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

                        {/* Main Content Section */}
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

export default AdminProfile;
