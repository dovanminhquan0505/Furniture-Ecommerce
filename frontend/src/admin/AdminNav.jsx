import React, { useEffect, useRef, useState } from "react";
import { Badge, Container, Row, Spinner } from "reactstrap";
import "../styles/admin-nav.css";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import useAdmin from "../custom-hooks/useAdmin";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { getPendingOrders, logoutUser } from "../api";
import defaultAvatar from "../assets/images/user-icon.png";
import { userActions } from "../redux/slices/userSlice";

const admin_nav = [
    {
        display: "Profile",
        path: "/admin/profile",
    },
    {
        display: "Dashboard",
        path: "/admin/dashboard",
    },
    {
        display: "Users",
        path: "/admin/users",
    },
    {
        display: "Sellers",
        path: "/admin/sellers",
    },
    {
        display: "Orders",
        path: "/admin/orders",
    },
    {
        display: "Pending Orders",
        path: "/admin/pending-orders",
    },
    {
        display: "Refund Disputes",
        path: "/admin/refund-disputes",
    }
];

const AdminNav = () => {
    const { isAdmin, isLoading } = useAdmin();
    const profileActionRef = useRef();
    const notificationsRef = useRef();
    const { currentUser } = useSelector((state) => state.user);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        if (isAdmin && currentUser) {
            const fetchPendingOrders = async () => {
                try {
                    const requests = await getPendingOrders();
                    setPendingRequests(requests);
                } catch (error) {
                    toast.error(
                        "Failed to fetch pending orders: " + error.message
                    );
                }
            };
            fetchPendingOrders();
        }
    }, [isAdmin, currentUser]);

    // Handle auto turn off profile actions when user clicks on outside.
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileActionRef.current &&
                !profileActionRef.current.contains(event.target)
            ) {
                profileActionRef.current.classList.remove(
                    "active__profileActions"
                );
            }

            if (
                notificationsRef.current &&
                !notificationsRef.current.contains(event.target)
            ) {
                setShowNotifications(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!isAdmin) {
        return null;
    }

    const handleLogOut = async () => {
        try {
            await logoutUser();
            dispatch(userActions.clearUser());
            await signOut(auth);
            toast.success("Logged out successfully");
            navigate("/login");
        } catch (error) {
            toast.error(error.message || "Logout failed");
        }
    };

    const toggleProfileActions = () => {
        if (profileActionRef.current) {
            profileActionRef.current.classList.toggle("active__profileActions");
        }
        setShowNotifications(false);
    };

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
        profileActionRef.current.classList.remove("active__profileActions");
    };

    if (isLoading) {
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
        <>
            <header className="admin__header">
                <div className="admin__nav-top">
                    <Container>
                        <div className="admin__nav-wrapper-top">
                            <div className="logo__admin">
                                <Link to="/home">
                                    <h2>Multimart</h2>
                                </Link>
                            </div>

                            <div className="search__box">
                                <input type="text" placeholder="Search..." />
                                <span>
                                    <i className="ri-search-line"></i>
                                </span>
                            </div>

                            <div className="admin__nav-top-right">
                                <span
                                    onClick={toggleNotifications}
                                    style={{
                                        cursor: "pointer",
                                        position: "relative",
                                    }}
                                >
                                    <i className="ri-notification-2-line"></i>
                                    {pendingRequests.length > 0 && (
                                        <Badge
                                            color="danger"
                                            pill
                                            style={{
                                                position: "absolute",
                                                top: -5,
                                                right: -5,
                                            }}
                                        >
                                            {pendingRequests.length}
                                        </Badge>
                                    )}
                                </span>
                                <span>
                                    <i className="ri-settings-3-line"></i>
                                </span>
                                <div className="profile">
                                    <motion.img
                                        whileTap={{ scale: 1.2 }}
                                        src={
                                            currentUser?.photoURL ||
                                            defaultAvatar
                                        }
                                        alt=""
                                        className="admin__avatar"
                                        onClick={toggleProfileActions}
                                    />

                                    <div
                                        className="profile__actions"
                                        ref={profileActionRef}
                                        onClick={toggleProfileActions}
                                    >
                                        <div className="d-flex align-items-center justify-content-center flex-column">
                                            <span
                                                className="logout d-flex align-items-center"
                                                onClick={handleLogOut}
                                            >
                                                <Link
                                                    to="/login"
                                                    className="logout__profile"
                                                >
                                                    Log out
                                                </Link>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Container>
                </div>
            </header>

            {showNotifications && (
                <div className="notifications__panel">
                    <h3 className="notifications__title">New Notifications</h3>
                    {pendingRequests.length === 0 ? (
                        <p>Notifications not found</p>
                    ) : (
                        <ul className="notifications__list">
                            {pendingRequests.map((request) => (
                                <li
                                    key={request.id}
                                    className="notification__item"
                                    ref={notificationsRef}
                                >
                                    <Link
                                        to="/admin/pending-orders"
                                        className="notification__link"
                                    >
                                        <div className="notification__content">
                                            <img
                                                src={request.avatarURL}
                                                alt="User Avatar"
                                                className="notification__avatar"
                                            />
                                            <div className="notification__text">
                                                <h4 className="notification__title">
                                                    New seller register requests
                                                </h4>
                                                <p className="notification__details">
                                                    {request.storeName} -{" "}
                                                    {request.fullName}
                                                </p>
                                                <small className="notification__time">
                                                    {new Date(
                                                        request.createdAt
                                                    ).toLocaleString()}
                                                </small>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="notifications__viewAll">
                        <Link to="/admin/pending-orders">View all</Link>
                    </div>
                </div>
            )}

            <section className="admin__menu p-0">
                <Container>
                    <Row>
                        <div className="admin__navigation">
                            <ul className="admin__menu-list">
                                {admin_nav.map((item, index) => (
                                    <li
                                        className="admin__menu-item"
                                        key={index}
                                    >
                                        <NavLink
                                            to={item.path}
                                            end
                                            className={(navClass) =>
                                                navClass.isActive
                                                    ? "active__admin-menu"
                                                    : ""
                                            }
                                        >
                                            {item.display}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default AdminNav;
