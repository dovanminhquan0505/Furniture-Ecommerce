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
    Nav,
    Pagination,
    InputGroup,
    FormControl,
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
    Search,
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
    getUserProfileById,
    getUserSubOrders,
    updateUserById,
    updateUserPassword,
    updateUserPhoto,
    uploadFile,
} from "../api";
import OrderDetailsModal from "../components/Modal/OrderDetailsModal";

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
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 4;
    const [searchQuery, setSearchQuery] = useState("");

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
                const subOrders = await getUserSubOrders(userId);
                setOrderInfo(subOrders);
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

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStatus]);

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

    const handleDeleteOrder = async (subOrderId, itemId, orderStatus, cancelStatus, refundStatus) => {
        const user = auth.currentUser;
        if (!user) {
            toast.error("No authenticated user found!");
            return;
        }

        const confirmDelete = window.confirm("Are you sure you want to delete this order from your order history?");
        if (!confirmDelete) {
            return;
        }

        try {
            // Determine the correct status to send to backend
            let status;
            if (cancelStatus === "cancelDirectly" || cancelStatus === "cancelled") {
                status = cancelStatus;
            } else if (refundStatus === "Refunded") {
                status = "Refunded";
            } else {
                status = orderStatus;
            }

            await deleteUserOrder(subOrderId, { itemId, status });

            // Remove the specific item from orderInfo state
            setOrderInfo((prevOrders) => {
                return prevOrders.filter((order) => {
                    // For refunded items, only remove the refunded entry (not the delivered entry)
                    if (status === "Refunded") {
                        return !(order.subOrderId === subOrderId && order.itemId === itemId && 
                                order.refundStatus === "Refunded");
                    }
                    
                    // For cancelled items
                    if (status === "cancelDirectly" || status === "cancelled") {
                        return !(order.subOrderId === subOrderId && order.itemId === itemId && 
                                (order.cancelStatus === "cancelDirectly" || order.cancelStatus === "cancelled"));
                    }
                    
                    // For regular items
                    return !(order.subOrderId === subOrderId && order.itemId === itemId && 
                            order.status === status && order.cancelStatus !== "cancelDirectly" && 
                            order.cancelStatus !== "cancelled" && order.refundStatus !== "Refunded");
                });
            });

            toast.success("Order item deleted successfully!");

            // Handle pagination adjustment
            setTimeout(() => {
                const updatedOrderInfo = orderInfo.filter((order) => {
                    // For refunded items, only remove the refunded entry (not the delivered entry)
                    if (status === "Refunded") {
                        return !(order.subOrderId === subOrderId && order.itemId === itemId && 
                                order.refundStatus === "Refunded");
                    }
                    
                    // For cancelled items
                    if (status === "cancelDirectly" || status === "cancelled") {
                        return !(order.subOrderId === subOrderId && order.itemId === itemId && 
                                (order.cancelStatus === "cancelDirectly" || order.cancelStatus === "cancelled"));
                    }
                    
                    // For regular items
                    return !(order.subOrderId === subOrderId && order.itemId === itemId && 
                            order.status === status && order.cancelStatus !== "cancelDirectly" && 
                            order.cancelStatus !== "cancelled" && order.refundStatus !== "Refunded");
                });

                const filteredOrders = updatedOrderInfo.filter((order) => {
                    const matchesSearch = order.productName.toLowerCase().includes(searchQuery.toLowerCase());
                    if (selectedStatus === "success") {
                        return (
                            (order.status === selectedStatus && 
                            order.cancelStatus !== "cancelDirectly" && 
                            order.cancelStatus !== "cancelled" &&
                            order.refundStatus !== "Refunded") || 
                            order.refundStatus === "Refunded" 
                            ) && matchesSearch;
                    } else if (selectedStatus === "cancelled") {
                        return (order.cancelStatus === "cancelDirectly" || order.cancelStatus === "cancelled") && matchesSearch;
                    } else if (selectedStatus === "Refunded") {
                        return order.refundStatus === "Refunded" && matchesSearch;
                    } else if (selectedStatus === "shipping") {
                        return order.status === selectedStatus && order.cancelStatus !== "cancelDirectly" && 
                            order.cancelStatus !== "cancelled" && order.refundStatus !== "Refunded" && matchesSearch;
                    } else {
                        return order.status === selectedStatus && order.cancelStatus !== "cancelDirectly" && 
                            order.cancelStatus !== "cancelled" && order.refundStatus !== "Refunded" && matchesSearch;
                    }
                });

                const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
                if (currentPage > totalPages && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
            }, 100);

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

    // Render Order Information
    const renderOrderInformation = () => {
        const statusTabs = [
            { key: "pending", label: "Pending Confirmation" },
            { key: "shipping", label: "Awaiting Shipment" },
            { key: "success", label: "Delivered" },
            { key: "cancelled", label: "Cancelled" },
            { key: "Refunded", label: "Returned" },
        ];

        const filteredOrders = orderInfo.filter((order) => {
            const matchesSearch = order.productName.toLowerCase().includes(searchQuery.toLowerCase());
            if (selectedStatus === "success") {
                return (
                    (order.status === selectedStatus && 
                    order.cancelStatus !== "cancelDirectly" && 
                    order.cancelStatus !== "cancelled" &&
                    order.refundStatus !== "Refunded") || 
                    order.refundStatus === "Refunded" 
                    ) && matchesSearch;
            } else if (selectedStatus === "cancelled") {
                return (order.cancelStatus === "cancelDirectly" || order.cancelStatus === "cancelled") && matchesSearch;
            } else if (selectedStatus === "Refunded") {
                return order.refundStatus === "Refunded" && matchesSearch;
            } else if (selectedStatus === "shipping") {
                return order.status === selectedStatus && order.cancelStatus !== "cancelDirectly" && 
                    order.cancelStatus !== "cancelled" && order.refundStatus !== "Refunded" && matchesSearch;
            } else {
                return order.status === selectedStatus && order.cancelStatus !== "cancelDirectly" && 
                    order.cancelStatus !== "cancelled" && order.refundStatus !== "Refunded" && matchesSearch;
            }
        });

        const indexOfLastOrder = currentPage * ordersPerPage;
        const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
        const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
        const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

        const handleShowOrderDetails = (order) => {
            const orderDetails = {
                ...order,
                deliveredAt: order.deliveredAt || null, 
                paymentMethod: order.paymentMethod || "Not Provided",
                requestedAt: order.requestedAt || null,
                refundedAt: order.refundedAt || null,
                evidence: order.evidence || [],
            };
            setSelectedOrder(orderDetails);
            setIsModalOpen(true);
        };

        const handlePageChange = (pageNumber) => {
            setCurrentPage(pageNumber);
        };

        const renderPaginationItems = () => {
            const items = [];
            const maxVisiblePages = 5;
            let startPage, endPage;

            if (totalPages <= maxVisiblePages) {
                startPage = 1;
                endPage = totalPages;
            } else {
                const half = Math.floor(maxVisiblePages / 2);
                if (currentPage <= half) {
                    startPage = 1;
                    endPage = maxVisiblePages;
                } else if (currentPage + half >= totalPages) {
                    startPage = totalPages - maxVisiblePages + 1;
                    endPage = totalPages;
                } else {
                    startPage = currentPage - half;
                    endPage = currentPage + half;
                }
            }

            for (let number = startPage; number <= endPage; number++) {
                items.push(
                    <Pagination.Item
                        key={number}
                        active={number === currentPage}
                        onClick={() => handlePageChange(number)}
                    >
                        {number}
                    </Pagination.Item>
                );
            }

            return items;
        };

        return (
            <div className="order-info">
                <h3>Your Orders</h3>
                <div className="order-status-tabs-container">
                    <Nav
                        variant="tabs"
                        activeKey={selectedStatus}
                        onSelect={(key) => setSelectedStatus(key)}
                        className="order-status-tabs"
                    >
                        {statusTabs.map((tab) => (
                            <Nav.Item key={tab.key}>
                                <Nav.Link eventKey={tab.key}>{tab.label}</Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>
                    <InputGroup className="order-search-bar">
                        <InputGroup.Text>
                            <Search size={18} />
                        </InputGroup.Text>
                        <FormControl
                            placeholder="Search by product name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </InputGroup>
                </div>
                <Table striped bordered hover className="mt-1">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Product Name</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentOrders.length > 0 ? (
                            currentOrders.map((order, index) => (
                                <tr
                                    key={`${order.subOrderId}-${order.itemId}-${order.cancelStatus}-${order.refundStatus}-${index}`}
                                    onClick={() => handleShowOrderDetails(order)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <td>
                                        <img
                                            src={order.productImage || "https://via.placeholder.com/50"}
                                            alt={order.productName}
                                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/50";
                                            }}
                                        />
                                    </td>
                                    <td>{order.productName}</td>
                                    <td>{order.quantity}</td>
                                    <td>${order.price}</td>
                                    <td>${order.totalPrice}</td>
                                    <td>
                                        {order.cancelStatus === "cancelDirectly" || order.cancelStatus === "cancelled"
                                            ? `Cancelled`
                                            : order.refundStatus === "Refunded"
                                            ? `Refunded`
                                            : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </td>
                                    <td>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="action-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewOrder(order.orderId);
                                            }}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="action-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteOrder(
                                                    order.subOrderId, 
                                                    order.itemId, 
                                                    order.status, 
                                                    order.cancelStatus,
                                                    order.refundStatus
                                                );
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center">
                                    No orders found for this status.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
                {totalPages > 1 && (
                    <Pagination>
                        <Pagination.Prev
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        />
                        {renderPaginationItems()}
                        <Pagination.Next
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        />
                    </Pagination>
                )}
                <OrderDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    order={selectedOrder}
                />
            </div>
        );
    };

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
                                        userInfo?.photoURL ||
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
                                {userInfo?.displayName}
                            </h1>
                            <p className="profile-role">{userInfo?.role}</p>
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
