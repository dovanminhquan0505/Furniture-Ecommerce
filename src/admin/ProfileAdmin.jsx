import React, { useEffect, useRef, useState } from "react";
import {
    Container,
    Row,
    Col,
    Button,
    Form,
    Spinner,
    Alert,
} from "react-bootstrap";
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
    EyeOff,
    Eye,
} from "lucide-react";
import "../styles/Profile.css";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import {
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signOut,
} from "firebase/auth";
import { useTheme } from "../components/UI/ThemeContext";
import { useNavigate } from "react-router-dom";
import useAdmin from "../custom-hooks/useAdmin";
import Helmet from "../components/Helmet/Helmet";
import {
    getAdminProfileById,
    getPendingOrders,
    logoutUser,
    updateAdminPassword,
    updateAdminPhoto,
    updateAdminProfile,
    uploadFile,
} from "../api";

const ProfileAdmin = () => {
    const [editing, setEditing] = useState(false);
    const inputFileRef = useRef(null);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isEmpty, setIsEmpty] = useState(false);
    const { isAdmin, isLoading } = useAdmin();
    const [isAvatarUpLoading, setIsAvatarUpLoading] = useState(false);
    const [activeSection, setActiveSection] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [adminInfo, setAdminInfo] = useState({
        displayName: "",
        birthDate: "",
        email: "",
        phone: "",
        address: "",
        role: "",
        photoURL: "",
    });
    const [originalAdminInfo, setOriginalAdminInfo] = useState({
        ...adminInfo,
    });

    useEffect(() => {
        if (isAdmin) {
            const fetchPendingOrders = async () => {
                try {
                    const requests = await getPendingOrders();
                    setPendingRequests(requests);
                } catch (error) {
                    toast.error("Failed to fetch pending orders: " + error.message);
                }
            };

            fetchPendingOrders();
        }
    }, [isAdmin]);

    // Get admin data from firebase
    useEffect(() => {
        const fetchAdminData = async (user) => {
            setIsDataLoading(true);
            setIsEmpty(false);
            if (!user) {
                toast.error("Unauthorized! Please log in again.");
                navigate("/login");
                return;
            }

            const userId = user.uid;

            try {
                const data = await getAdminProfileById(userId);
                if (!data) {
                    setIsEmpty(true);
                    return;
                }
                const newAdminInfo = {
                    displayName: data.displayName || "",
                    birthDate: data.birthDate || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    role: data.role || "admin",
                    photoURL: data.photoURL || "",
                };
                setAdminInfo(newAdminInfo);
                setOriginalAdminInfo(newAdminInfo);
            } catch (error) {
                toast.error("Fetch failed for admin: " + error.message);
            } finally {
                setIsDataLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchAdminData(user);
            } else {
                toast.error("User not found!");
                navigate("/login");
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Handle Edit profile admin
    const handleEditProfile = async () => {
        const user = auth.currentUser;
        if (!user) {
            toast.error("No authenticated user found!");
            return;
        }

        const userId = user.uid;

        try {
            await updateAdminProfile(userId, {
                displayName: adminInfo.displayName,
                birthDate: adminInfo.birthDate,
                phone: adminInfo.phone,
                address: adminInfo.address,
            });
            toast.success("Profile updated successfully!");
            setEditing(false);
        } catch (error) {
            toast.error("Failed to update profile: " + error.message);
        }
    };

    // Handle Input change when user changes their information
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAdminInfo((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Cancel edit and revert changes
    const handleCancelEdit = () => {
        setAdminInfo(originalAdminInfo);
        setEditing(false);
    };

    // Handle Change Password
    const handleChangePassword = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            toast.error("No authenticated user found!");
            return;
        }

        const userId = user.uid;
        const currentPassword = e.target.currentPassword.value;
        const newPassword = e.target.newPassword.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (!currentPassword) {
            toast.error("Please enter your current password!");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters long!");
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            await reauthenticateWithCredential(user, credential);

            await updateAdminPassword(userId, newPassword);
            toast.success("Password updated successfully!");
            e.target.reset();
        } catch (error) {
            if (error.code === "auth/wrong-password") {
                toast.error("Current password is incorrect!");
            } else if (error.code === "auth/invalid-credential") {
                toast.error("Current password is incorrect!");
            } else {
                toast.error("Failed to change password: " + error.message);
            }
        }
    };

    // Handle Toggle Dark Mode
    const handleDarkModeToggle = () => {
        toggleDarkMode();
    };

    const handleLogOut = async () => {
        const user = auth.currentUser;
        if (!user) {
            toast.error("No authenticated user found!");
            return;
        }

        try {
            await logoutUser();
            await signOut(auth);
            toast.success("Logged out");
            navigate("/login");
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsAvatarUpLoading(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAdminInfo((prev) => ({ ...prev, photoURL: reader.result }));
            };
            reader.readAsDataURL(file);

            const user = auth.currentUser;
            if (!user) {
                toast.error("No authenticated user found!");
                setIsAvatarUpLoading(false);
                return;
            }

            const userId = user.uid;

            try {
                const uploadResponse = await uploadFile(file);
                const photoURL = uploadResponse.fileURL;
                await updateAdminPhoto(userId, photoURL);
                toast.success("Avatar uploaded successfully!");
            } catch (error) {
                toast.error("Failed to upload avatar: " + error.message);
            } finally {
                setIsAvatarUpLoading(false);
            }
        }
    };

    const handleAvatarClick = () => {
        if (editing) {
            inputFileRef.current.click();
        } else {
            toast.info("You need to be in Edit mode to upload");
        }
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
                onClick={() => {
                    editing ? handleEditProfile() : setEditing(true);
                }}
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

    // Render Change Password
    const renderChangePasswordAdmin = () => (
        <div className="change-password">
            <h3>Change Password</h3>
            <p>
                For your account's security, do not share your password with
                anyone else.
            </p>
            <form
                className="change-password-form"
                onSubmit={handleChangePassword}
            >
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
                    <label htmlFor="confirmPassword">
                        Confirm New Password
                    </label>
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
                <Button
                    type="submit"
                    variant="primary"
                    className="change-password-button"
                >
                    Save Changes
                </Button>
            </form>
        </div>
    );

    // Render Notifications
    const renderNotifications = () => (
        <div className="notifications-section">
            <h3>Notifications</h3>

            <div className="notifications-container">
                {pendingRequests.length === 0 ? (
                    <Alert variant="info">No notifications found</Alert>
                ) : (
                    <div className="notifications-list">
                        {pendingRequests.map((request) => (
                            <div key={request.id} className="notification-item">
                                <div className="notification-content">
                                    <div className="notification-avatar">
                                        <img
                                            src={request.avatarURL}
                                            alt="User Avatar"
                                            className="rounded-circle"
                                            width="40"
                                            height="40"
                                        />
                                    </div>
                                    <div className="notification-details">
                                        <h5>New Seller Registration Request</h5>
                                        <p>
                                            Store: {request.storeName}
                                            <br />
                                            Owner: {request.fullName}
                                        </p>
                                        <small className="text-muted">
                                        {new Date(request.createdAt).toLocaleString()}
                                    </small>
                                    </div>
                                </div>
                                <div className="notification-actions mt-2">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() =>
                                            navigate("/admin/pending-orders")
                                        }
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Render Dark Mode
    const renderDarkMode = () => (
        <div>
            <h3>Display Settings</h3>
            <p>Toggle between light and dark mode for the admin panel.</p>
            <Form.Check
                type="switch"
                id="dark-mode-switch"
                label="Dark Mode"
                checked={isDarkMode}
                onChange={handleDarkModeToggle}
                className="dark-mode-toggle"
            />
        </div>
    );

    // Render LogOut information
    const renderLogOut = () => (
        <div>
            <h3>Logout</h3>
            <p>Are you sure you want to log out of the user profile?</p>
            <Button variant="danger" className="mt-3" onClick={handleLogOut}>
                Logout
            </Button>
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
            content: renderChangePasswordAdmin(),
        },
        {
            icon: <Bell size={20} />,
            text: "Notifications",
            content: renderNotifications(),
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
            content: renderDarkMode(),
        },
        {
            icon: <LogOut size={20} />,
            text: "Logout",
            content: renderLogOut(),
        },
    ];

    if (isEmpty) {
        return (
            <Alert variant="info">
                No user data available. Please update your profile.
            </Alert>
        );
    }

    if (isLoading || isDataLoading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner style={{ width: "3rem", height: "3rem" }} />
                <span className="visually-hidden">Loading...</span>
            </Container>
        );
    }

    if (!isAdmin) {
        toast.error("Admin only!");
    }

    return (
        <Helmet title=" Profile">
            <Container
                fluid
                className={`profile__personal ${
                    isDarkMode ? "dark-mode" : "light-mode"
                }`}
            >
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
                                    onClick={handleAvatarClick}
                                    style={{
                                        cursor: editing ? "pointer" : "default",
                                        opacity: isAvatarUpLoading ? 0.5 : 1,
                                    }}
                                />
                                {editing && (
                                    <>
                                        <input
                                            type="file"
                                            ref={inputFileRef}
                                            accept="image/*"
                                            style={{ display: "none" }}
                                            onChange={handleAvatarChange}
                                        />
                                        <div className="avatar-edit-overlay">
                                            {isAvatarUpLoading
                                                ? "Uploading..."
                                                : "Click to change your avatar"}
                                        </div>
                                    </>
                                )}

                                {isAvatarUpLoading && (
                                    <div className="avatar-loading-overlay">
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                )}
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

export default ProfileAdmin;
