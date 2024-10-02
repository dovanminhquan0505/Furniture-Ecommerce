import React, { useRef } from "react";
import { Container, Row, Spinner } from "reactstrap";
import useAuth from "../custom-hooks/useAuth";
import "../styles/admin-nav.css";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import useAdmin from "../custom-hooks/useAdmin";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";

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
        display: "All-Products",
        path: "/admin/all-products",
    },

    {
        display: "Orders",
        path: "/admin/orders",
    },

    {
        display: "Users",
        path: "/admin/users",
    },
];

const AdminNav = () => {
    const { currentUser } = useAuth();
    const { isAdmin, isLoading } = useAdmin();
    const profileActionRef = useRef();

    if (isLoading) {
        <Container
            className="d-flex justify-content-center align-items-center"
            style={{ height: "100vh" }}
        >
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
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
                                    <i class="ri-search-line"></i>
                                </span>
                            </div>

                            <div className="admin__nav-top-right">
                                <span>
                                    <i class="ri-notification-2-line"></i>
                                </span>
                                <span>
                                    <i class="ri-settings-3-line"></i>
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
