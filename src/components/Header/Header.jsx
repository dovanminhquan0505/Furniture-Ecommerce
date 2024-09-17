import React, { useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./header.css";
import { motion } from "framer-motion";
import logo from "../../assets/images/eco-logo.png";
import userIcon from "../../assets/images/user-icon.png";
import { useSelector } from "react-redux";
import { Container, Row } from "reactstrap";
import useAuth from "../../custom-hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase.config";
import { toast } from "react-toastify";

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
    const totalQuantity = useSelector((state) => state.cart.totalQuantity);
    const profileActionRef = useRef(null);

    const menuRef = useRef(null);

    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const stickyHeaderFunc = () => {
        window.addEventListener("scroll", () => {
            if (
                document.body.scrollTop > 80 ||
                document.documentElement.scrollTop > 80
            ) {
                headerRef.current.classList.add("sticky__header");
            } else {
                headerRef.current.classList.remove("sticky__header");
            }
        });
    };

    const logOut = () => {
        signOut(auth)
           .then(() => {
                toast.success('Logged out');
            })
           .catch((error) => {
                toast.error(error.message);
            });
    }

    useEffect(() => {
        stickyHeaderFunc();
        return () => {
            window.removeEventListener("scroll", stickyHeaderFunc);
        };
    });

    const menuToggle = () => menuRef.current.classList.toggle("active__menu");

    //Navigate to Cart
    const navigateToCart = () => {
        navigate("/cart");
    };

    const toggleProfileActions = () => {
        if (profileActionRef.current) {
            profileActionRef.current.classList.toggle("active__profileActions");
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
                                <h1>Multimart</h1>
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

                        <div className="nav__icons">
                            <span className="fav__icon">
                                <i class="ri-heart-line"></i>
                                <span className="badge">1</span>
                            </span>

                            <span
                                className="cart__icon"
                                onClick={navigateToCart}
                            >
                                <i class="ri-shopping-cart-line"></i>
                                <span className="badge">{totalQuantity}</span>
                            </span>

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
                                    {currentUser ? (
                                        <span onClick={logOut}>Logout</span>
                                    ) : (
                                        <div className="d-flex align-items-center justify-content-center flex-column">
                                            <Link to="/signup">SignUp</Link>
                                            <Link to="/login">Login</Link>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mobile__menu">
                                <span onClick={menuToggle}>
                                    <i class="ri-menu-line"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </Row>
            </Container>
        </header>
    );
};

export default Header;
