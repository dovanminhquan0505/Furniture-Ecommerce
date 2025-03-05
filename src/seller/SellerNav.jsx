import React, { useEffect, useRef } from "react";
import "../seller/styles/seller-nav.css";
import { Bell } from "lucide-react";
import { useLocation, NavLink, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import useSeller from "../custom-hooks/useSeller";
import { Container, Spinner } from "reactstrap";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

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
    const { currentUser } = useSelector((state) => state.user);
    const { isSeller, isLoading } = useSeller();

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
        };

        // Add event listener
        document.addEventListener("mousedown", handleClickOutside);

        // Cleanup event listener when component is unmounted
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
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

    const logOut = () => {
        signOut(auth)
            .then(() => {
                toast.success("Logged out");
            })
            .catch((error) => {
                toast.error(error.message);
            });
    };

    const toggleProfileActions = () => {
        if (profileActionRef.current) {
            profileActionRef.current.classList.toggle("active__profileActions");
        }
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
                <div className="seller__nav__notification">
                    <Bell size={20} />
                    <span className="seller__nav__notification__badge"></span>
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
                                <Link to="/login" className="logout__seller__profile">
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
