import React, { useRef, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./header.css";
import { motion } from "framer-motion";
import logo from "../../assets/images/eco-logo.png";
import userIcon from "../../assets/images/user-icon.png";
import { useSelector } from "react-redux";
import { Container, Row } from "reactstrap";
import { toast } from "react-toastify";
import useAdmin from "../../custom-hooks/useAdmin";
import { useDispatch } from "react-redux";
import { userActions } from "../../redux/slices/userSlice";
import { cartActions } from "../../redux/slices/cartSlice";
import { wishListActions } from "../../redux/slices/wishListSlice";
import { getUserNotifications, logoutUser, markUserNotificationAsRead } from "../../api";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase.config";

const nav__links = [
    {
        path: "home",
        display: "Home",
    },
    {
        path: "shop",
        display: "Shop",
    },
    {
        path: "cart",
        display: "Cart",
    },
];

const Header = () => {
    const headerRef = useRef(null);
    const totalQuantity = useSelector(
        (state) => state.cart?.totalQuantity || 0
    );
    const totalQuantityWishList = useSelector(
        (state) => state.wishlist?.totalQuantity || 0
    );
    const profileActionRef = useRef(null);
    const notificationRef = useRef(null);
    const { currentUser } = useSelector((state) => state.user);
    const menuRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAdmin } = useAdmin();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const stickyHeaderFunc = () => {
        window.addEventListener("scroll", () => {
            if (headerRef.current) {
                if (
                    document.body.scrollTop > 80 ||
                    document.documentElement.scrollTop > 80
                ) {
                    headerRef.current.classList.add("sticky__header");
                } else {
                    headerRef.current.classList.remove("sticky__header");
                }
            }
        });
    };

    const logOut = async () => {
        try {
            await logoutUser();
            dispatch(userActions.setUser(null));
            dispatch(cartActions.clearCart());
            dispatch(wishListActions.clearWishList());
            await signOut(auth);
            toast.success("Logged out successfully");
            navigate("/login");
        } catch (error) {
            toast.error(error.message || "Logout failed");
        }
    };

    useEffect(() => {
        stickyHeaderFunc();
        return () => {
            window.removeEventListener("scroll", stickyHeaderFunc);
        };
    }, []);

    const menuToggle = () => {
        if (menuRef.current) {
            menuRef.current.classList.toggle("active__menu");
        } else {
            console.warn("menuRef is null");
        }
    };

    //Navigate to Cart
    const navigateToCart = () => {
        navigate("/cart");
    };

    //Navigate to WishList
    const navigateToWishList = () => {
        navigate("/wishlist");
    };

    const toggleProfileActions = () => {
        if (profileActionRef.current) {
            profileActionRef.current.classList.toggle("active__profileActions");
        }
    };

    const timeAgo = (date) => {
        const now = new Date();
        const diff = Math.floor((now - new Date(date)) / 1000);
        if (diff < 60) return `${diff} seconds ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!currentUser) {
                setNotifications([]); 
                return;
            }
            try {
                const data = await getUserNotifications(currentUser.uid);
                setNotifications(data || []);
            } catch (error) {
                setNotifications([]); 
                console.error("Error fetching notifications:", error.message);
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Update every 60 seconds
        return () => clearInterval(interval);
    }, [currentUser]);

    // Handle auto turn off profile actions when user clicks on outside.
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

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    const markAsRead = async (notificationId, orderId) => {
        try {
            await markUserNotificationAsRead(currentUser.uid, notificationId);
            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === notificationId ? { ...notif, isRead: true } : notif
                )
            );
            navigate(`/placeorder/${orderId}`);
        } catch (error) {
            toast.error("Error marking notification as read: " + error.message);
        }
    };

    return (
        <header className="header" ref={headerRef}>
            <Container>
                <Row>
                    <div className="nav__wrapper">
                        <div className="logo">
                            <img src={logo} alt="logo" />
                            <div>
                                <Link to="home">
                                    <h1>Multimart</h1>
                                </Link>
                            </div>
                        </div>

                        <div
                            className="navigation"
                            ref={menuRef}
                            onClick={menuToggle}
                        >
                            <ul className="menu">
                                {nav__links.map((item, index) => (
                                    <li className="nav_item" key={index}>
                                        <NavLink
                                            to={item.path}
                                            className={(navClass) =>
                                                navClass.isActive
                                                    ? "nav__active"
                                                    : ""
                                            }
                                        >
                                            {item.display}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="nav__right">
                            {!isAdmin && (
                                <>
                                    <Link
                                        to="/seller/dashboard"
                                        className="become-seller-link"
                                    >
                                        Sellers Channel
                                    </Link>

                                    <Link
                                        to="/seller/signup"
                                        className="become-seller-link"
                                    >
                                        Become Multimart Seller
                                    </Link>
                                </>
                            )}

                            <div className="nav__icons">
                                <span
                                    className="fav__icon"
                                    onClick={navigateToWishList}
                                >
                                    <i className="ri-heart-line"></i>
                                    <span className="badge">
                                        {totalQuantityWishList}
                                    </span>
                                </span>

                                <span
                                    className="cart__icon"
                                    onClick={navigateToCart}
                                >
                                    <i className="ri-shopping-cart-line"></i>
                                    <span className="badge">
                                        {totalQuantity}
                                    </span>
                                </span>

                                <div className="header__notification-wrapper" ref={notificationRef}>
                                    <span className="header__notification-icon" onClick={toggleNotifications}>
                                        <i className="ri-notification-3-line"></i>
                                        {notifications.length > 0 && (
                                            <span className="badge">
                                                {notifications.filter((n) => !n.isRead).length}
                                            </span>
                                        )}
                                    </span>
                                    <div className={`header__notifications-list ${showNotifications ? "active__notifications" : ""}`}>
                                        {notifications.length === 0 ? (
                                            <span className="header__no-notifications">No notifications</span>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    className={`header__notification-item ${notif.isRead ? "read" : ""}`}
                                                    onClick={() => markAsRead(notif.id, notif.totalOrderId)}
                                                >
                                                    {notif.imgUrl && (
                                                        <img
                                                            src={notif.imgUrl}
                                                            alt="Product"
                                                            className="header__notification-product-img"
                                                        />
                                                    )}
                                                    <div className="header__notification-content">
                                                        <p>{notif.message}</p>
                                                        <span className="header__notification-time">
                                                            {timeAgo(notif.createdAt)}
                                                        </span>
                                                    </div>
                                                    {!notif.isRead && <span className="header__notification-dot"></span>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="profile">
                                    <motion.img
                                        whileTap={{ scale: 1.2 }}
                                        src={
                                            currentUser
                                                ? currentUser.photoURL
                                                : userIcon
                                        }
                                        alt=""
                                        onClick={toggleProfileActions}
                                    />

                                    <div
                                        className="profile__actions"
                                        ref={profileActionRef}
                                        onClick={toggleProfileActions}
                                    >
                                        {currentUser ? ( //Check user exists
                                            <div className="d-flex align-items-center justify-content-center flex-column">
                                                {!isAdmin && (
                                                    <>
                                                        <span className="admin__profile d-flex align-items-center">
                                                            <Link
                                                                to="/profile"
                                                                className="adminPersonal__profile"
                                                            >
                                                                Profile
                                                            </Link>
                                                        </span>

                                                        <div className="line mb-2 mt-2"></div>
                                                    </>
                                                )}

                                                {isAdmin && ( //Check admin exists
                                                    <>
                                                        <span className="admin__profile d-flex align-items-center">
                                                            <Link
                                                                to="/admin/profile"
                                                                className="adminPersonal__profile"
                                                            >
                                                                Profile
                                                            </Link>
                                                        </span>

                                                        <div className="line mb-2 mt-2"></div>

                                                        <span className="dashboard d-flex align-items-center">
                                                            <Link
                                                                to="/admin/dashboard"
                                                                className="dashboard__profile"
                                                            >
                                                                Dashboard
                                                            </Link>
                                                        </span>

                                                        <div className="line mb-2 mt-2"></div>
                                                    </>
                                                )}

                                                <span
                                                    className="logout d-flex align-items-center"
                                                    onClick={logOut}
                                                >
                                                    <Link
                                                        to="/login"
                                                        className="logout__profile"
                                                    >
                                                        Log out
                                                    </Link>
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center flex-column">
                                                <span className="login d-flex align-items-center mb-2">
                                                    <Link
                                                        to="/login"
                                                        className="login__profile"
                                                    >
                                                        Login
                                                    </Link>
                                                </span>

                                                <div className="line"></div>

                                                <span className="signup d-flex align-items-center">
                                                    <Link
                                                        to="/signup"
                                                        className="signup__profile"
                                                    >
                                                        Sign Up
                                                    </Link>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mobile__menu">
                                    <span onClick={menuToggle}>
                                        <i className="ri-menu-line"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Row>
            </Container>
        </header>
    );
};

export default Header;
