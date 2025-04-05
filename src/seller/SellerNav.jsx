import React, { useEffect, useRef, useState } from "react";
import "../seller/styles/seller-nav.css";
import { Bell } from "lucide-react";
import { useLocation, NavLink, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useSeller from "../custom-hooks/useSeller";
import { Container, Spinner } from "reactstrap";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { getSellerNotifications, getUserById, logoutUser } from "../api";

const seller_nav = [
    {
        display: "Store Information",
        path: "/seller/store-information",
    },
    {
        display: "Dashboard",
        path: "/seller/dashboard",
    },
    {
        display: "Products",
        path: "/seller/all-products",
    },
    {
        display: "Orders",
        path: "/seller/orders",
    },
];

const SellerNav = () => {
    const location = useLocation();
    const profileActionRef = useRef();
    const notificationRef = useRef();
    const { currentUser } = useSelector((state) => state.user);
    const { isSeller, isLoading } = useSeller();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [sellerId, setSellerId] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        const fetchSellerId = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("You must be logged in");
                navigate("/login");
                return;
            }

            const userData = await getUserById(currentUser.uid);
            setSellerId(userData.sellerId);
        };
        fetchSellerId();
    }, [navigate]);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!sellerId) return;
            try {
                const data = await getSellerNotifications(sellerId);
                setNotifications(data);
            } catch (error) {
                toast.error("Error fetching notifications: " + error.message);
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Cập nhật mỗi 60 giây
        return () => clearInterval(interval);
    }, [sellerId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileActionRef.current &&
                !profileActionRef.current.contains(event.target)
            ) {
                profileActionRef.current.classList.remove("active__profileActions");
            }
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    if (!isSeller) {
        return null;
    }

    const logOut = async () => {
        try {
            await logoutUser();
            await signOut(auth);
            toast.success("Logged out successfully");
            navigate("/login");
        } catch (error) {
            toast.error("Logout failed: " + error.message);
        }
    };

    const toggleProfileActions = () => {
        if (profileActionRef.current) {
            profileActionRef.current.classList.toggle("active__profileActions");
        }
    };

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    const timeAgo = (date) => {
        const now = new Date();
        const diff = Math.floor((now - new Date(date)) / 1000);
        if (diff < 60) return `${diff} seconds ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    return (
        <nav className="seller__nav">
            <div className="logo__seller">
                <Link to="/home">
                    <h2 className="logo__seller-text">Multimart</h2>
                </Link>
            </div>
            <ul className="seller__nav__list">
                {seller_nav.map((item, index) => (
                    <li
                        key={index}
                        className={`seller__nav__item ${
                            location.pathname === item.path ? "active" : ""
                        }`}
                    >
                        <NavLink
                            to={item.path}
                            end
                            className={({ isActive }) =>
                                isActive ? "active" : ""
                            }
                        >
                            {item.display}
                        </NavLink>
                    </li>
                ))}
            </ul>
            <div className="seller__nav__actions">
                <div className="seller__nav__notification" ref={notificationRef}>
                    <Bell size={20} onClick={toggleNotifications} />
                    {notifications.length > 0 && (
                        <span className="seller__nav__notification__badge">
                            {notifications.filter(n => !n.isRead).length}
                        </span>
                    )}
                    {showNotifications && (
                        <div className="notification__dropdown">
                            {notifications.length === 0 ? (
                                <p className="notification__empty">No notifications</p>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`notification__item ${notif.isRead ? "read" : ""}`}
                                        onClick={() => navigate("/seller/orders")}
                                    >
                                        <img
                                            src={notif.userAvatar || "default-avatar.png"}
                                            alt={notif.userName}
                                            className="notification__avatar"
                                        />
                                        <div className="notification__content">
                                            <p>
                                                {notif.message.includes('#') ? (
                                                    <>
                                                        {notif.message.split('#')[0]}
                                                        <strong className="order-id">#{notif.message.split('#')[1].split(' ')[0]}</strong>
                                                        {notif.message.split('#')[1].split(' ').slice(1).join(' ')}
                                                    </>
                                                ) : notif.message}
                                            </p>
                                            <span className="notification__time">
                                                {timeAgo(notif.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
                <div className="profile__seller">
                    <motion.img
                        whileTap={{ scale: 1.2 }}
                        src={currentUser.photoURL}
                        alt=""
                        className="seller__avatar"
                        onClick={toggleProfileActions}
                    />
                    <div
                        className="profile__seller__actions"
                        ref={profileActionRef}
                        onClick={toggleProfileActions}
                    >
                        <div className="d-flex align-items-center justify-content-center flex-column">
                            <span
                                className="logout__seller d-flex align-items-center"
                                onClick={logOut}
                            >
                                <Link
                                    to="/login"
                                    className="logout__seller__profile"
                                >
                                    Log out
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default SellerNav;
