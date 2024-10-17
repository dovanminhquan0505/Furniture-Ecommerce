import React, { useEffect, useRef } from "react";
import { Container, Row, Spinner } from "reactstrap";
import "../styles/admin-nav.css";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import useAdmin from "../custom-hooks/useAdmin";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

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
        display: "Orders",
        path: "/admin/orders",
    },
    {
        display: "Pending Orders",
        path: "/admin/pending-orders",
    },
];

const AdminNav = () => {
    const { isAdmin, isLoading } = useAdmin();
    const profileActionRef = useRef();
    const { currentUser } = useSelector((state) => state.user);

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
        };

        // Add event listener
        document.addEventListener("mousedown", handleClickOutside);

        // Cleanup event listener when component is unmounted
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (isLoading) {
        <Container
            className="d-flex justify-content-center align-items-center"
            style={{ height: "100vh" }}
        >
            <Spinner style={{ width: "3rem", height: "3rem" }} />
            <span className="visually-hidden">Loading...</span>
        </Container>;
    }

    if (!isAdmin) {
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
                                <span>
                                    <i className="ri-notification-2-line"></i>
                                </span>
                                <span>
                                    <i className="ri-settings-3-line"></i>
                                </span>
                                <div className="profile">
                                    <motion.img
                                        whileTap={{ scale: 1.2 }}
                                        src={currentUser.photoURL}
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
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Container>
                </div>
            </header>

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
