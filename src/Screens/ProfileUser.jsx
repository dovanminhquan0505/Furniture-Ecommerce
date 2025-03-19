import React, { useEffect, useRef, useState } from "react";
import {
    Container,
    Row,
    Col,
    Button,
    Table,
    Form,
    Spinner,
    Alert,
} from "react-bootstrap";
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
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import {
    EmailAuthProvider,
    onAuthStateChanged,
    reauthenticateWithCredential,
    signOut,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
import { useTheme } from "../components/UI/ThemeContext";
import { useDispatch } from "react-redux";
import { userActions } from "../redux/slices/userSlice";
import {
    deleteUserOrder,
    getUserOrders,
    getUserProfileById,
    updateUserById,
    updateUserPassword,
    updateUserPhoto,
    uploadFile,
} from "../api";

const ProfileUser = () => {
    const [editing, setEditing] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isEmpty, setIsEmpty] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const inputFileRef = useRef(null);
    const [isAvatarUpLoading, setIsAvatarUpLoading] = useState(false);
    const [activeSection, setActiveSection] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [userInfo, setUserInfo] = useState(null);

    const [orderInfo, setOrderInfo] = useState([]);

    const [originalUserInfo, setOriginalUserInfo] = useState({ ...userInfo });

    useEffect(() => {
        // Fetch user info
        const fetchUserData = async (user) => {
            setIsDataLoading(true);
            setIsEmpty(false);
            if (!user) {
                toast.error("Unauthorized! Please log in again.");
                navigate("/login");
                return;
            }

            const userId = user.uid;

            try {
                const userData = await getUserProfileById(userId);
                if (!userData) {
                    setIsEmpty(true);
                    return;
                }
                setUserInfo(userData);
                setOriginalUserInfo(userData);
                const orders = await getUserOrders(userId);
                setOrderInfo(orders);
            } catch (error) {
                toast.error("Failed to fetch user data: " + error.message);
            } finally {
                setIsDataLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserData(user);
            } else {
                toast.error("User not found!");
                navigate("/login");
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Handle Edit Profile
    const handleEditUserProfile = async () => {
        const user = auth.currentUser;
        if (!user) {
            toast.error("No authenticated user found!");
            return;
        }

        const userId = user.uid;

        try {
            await updateUserById(userId, {
                displayName: userInfo.displayName,
                birthDate: userInfo.birthDate,
                phone: userInfo.phone,
                address: userInfo.address,
            });
            toast.success("Updated Profile Successfully!");
            setEditing(false);
        } catch (error) {
            toast.error("Failed to update Profile: " + error.message);
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
        const user = auth.currentUser;
        if (!user) {
            toast.error("No authenticated user found!");
            return;
        }

        try {
            await deleteUserOrder(orderId);
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
            // Tạo credential để xác thực lại người dùng với mật khẩu hiện tại
            const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            // Xác thực lại người dùng
            await reauthenticateWithCredential(user, credential);

            await updateUserPassword(userId, newPassword);
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
            // Update temporary image in UI
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserInfo((prev) => ({ ...prev, photoURL: reader.result }));
            };
            reader.readAsDataURL(file);

            const user = auth.currentUser;
            if (!user) {
                toast.error("No authenticated user found!");
                setIsAvatarUpLoading(false);
                return;
            }

            const userId = user.uid;

            // Upload image to Firebase Storage
            try {
                const uploadResponse = await uploadFile(file);
                const photoURL = uploadResponse.fileURL;

                await updateUserPhoto(userId, photoURL);
                dispatch(userActions.updateUserPhoto(photoURL));

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

    // Render Personal Information
    const renderPersonalInfo = () => {
        if (!userInfo) {
            return <div>Loading personal information...</div>;
        }

        return (
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
                                value={userInfo.displayName || ""}
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
                                value={userInfo.birthDate || ""}
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
                        <strong>Email:</strong>{" "}
                        {userInfo.email || "Not Provided"}
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
                                value={userInfo.phone || ""}
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
                                value={userInfo.address || ""}
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
    };

    // Hàm helper để parse chuỗi ngày giờ thành đối tượng Date
    const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== "string") {
            console.log("dateString is invalid or not a string:", dateString);
            return null;
        }

        if (dateString === "No") {
            console.log("dateString is 'No':", dateString);
            return null;
        }

        const isoMatch = dateString.match(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        );
        if (isoMatch) {
            console.log("Parsing ISO string:", dateString);
            const parsedDate = new Date(dateString);
            if (isNaN(parsedDate)) {
                console.log("Failed to parse ISO string:", dateString);
                return null;
            }
            // Điều chỉnh múi giờ sang UTC+7 (Việt Nam)
            const offsetMinutes = 7 * 60; // UTC+7
            parsedDate.setMinutes(
                parsedDate.getMinutes() +
                    parsedDate.getTimezoneOffset() +
                    offsetMinutes
            );
            return parsedDate;
        }
        const dateOnlyMatch = dateString.match(/^\d{4}-\d{2}-\d{2}$/);
        if (dateOnlyMatch) {
            const dateTimeString = `${dateString}T00:00:00`;
            console.log("Parsing date-only string:", dateTimeString);
            const parsedDate = new Date(dateTimeString);
            if (isNaN(parsedDate)) {
                console.log(
                    "Failed to parse date-only string:",
                    dateTimeString
                );
                return null;
            }
            return parsedDate;
        }

        // Kiểm tra định dạng đầy đủ: "March 19, 2025 at 1:25:36PM UTC+7"
        const [datePart, timePartWithTZ] = dateString.split(" at ");
        if (!datePart || !timePartWithTZ) {
            console.log("Failed to split dateString:", dateString);
            return null;
        }

        const timeMatch = timePartWithTZ.match(/(\d{1,2}:\d{2}:\d{2})(AM|PM)/);
        if (!timeMatch) {
            console.log("Failed to match time in dateString:", dateString);
            return null;
        }

        const time = timeMatch[1];
        const period = timeMatch[2];
        const dateTimeString = `${datePart} ${time} ${period}`;

        const parsedDate = new Date(dateTimeString);
        if (isNaN(parsedDate)) {
            console.log("Failed to parse dateTimeString:", dateTimeString);
            return null;
        }

        return parsedDate;
    };

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
                        orderInfo.map((order) => {
                            // Parse Paid At
                            let paidAtDate;
                            if (order.paidAt) {
                                if (order.paidAt.toDate) {
                                    paidAtDate = order.paidAt.toDate();
                                } else {
                                    paidAtDate = parseDate(order.paidAt);
                                }
                            }

                            const paidAtFormatted = paidAtDate
                                ? paidAtDate.toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                  })
                                : "Not Paid";
                            const [paidAtDatePart, paidAtTimePart] =
                                paidAtFormatted !== "Not Paid"
                                    ? paidAtFormatted.split(", ")
                                    : ["", ""];

                            // Parse Delivered At
                            let deliveredAtDate;
                            if (order.deliveredAt) {
                                if (order.deliveredAt.toDate) {
                                    deliveredAtDate =
                                        order.deliveredAt.toDate();
                                } else {
                                    deliveredAtDate = parseDate(
                                        order.deliveredAt
                                    );
                                }
                            }

                            const deliveredAtFormatted = deliveredAtDate
                                ? deliveredAtDate.toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                  })
                                : "Not Delivered";
                            const [deliveredAtDatePart, deliveredAtTimePart] =
                                deliveredAtFormatted !== "Not Delivered"
                                    ? deliveredAtFormatted.split(", ")
                                    : ["", ""];

                            return (
                                <tr key={order.orderId}>
                                    <td>{order.orderId}</td>
                                    <td>{order.date}</td>
                                    <td>${order.totalPrice}</td>
                                    <td>
                                        {paidAtFormatted === "Not Paid" ? (
                                            "Not Paid"
                                        ) : (
                                            <div style={{ lineHeight: "1.2" }}>
                                                <div>{paidAtDatePart}</div>
                                                <div>
                                                    {paidAtTimePart ===
                                                        "00:00" &&
                                                    paidAtDate &&
                                                    paidAtDate.getHours() ===
                                                        0 &&
                                                    paidAtDate.getMinutes() ===
                                                        0
                                                        ? "N/A"
                                                        : paidAtTimePart}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {deliveredAtFormatted ===
                                        "Not Delivered" ? (
                                            "Not Delivered"
                                        ) : (
                                            <div style={{ lineHeight: "1.2" }}>
                                                <div>{deliveredAtDatePart}</div>
                                                <div>
                                                    {deliveredAtTimePart ===
                                                        "00:00" &&
                                                    deliveredAtDate &&
                                                    deliveredAtDate.getHours() ===
                                                        0 &&
                                                    deliveredAtDate.getMinutes() ===
                                                        0
                                                        ? "N/A"
                                                        : deliveredAtTimePart}
                                                </div>
                                            </div>
                                        )}
                                    </td>
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
                            );
                        })
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

    if (isDataLoading || !userInfo) {
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
                                        userInfo.photoURL ||
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
