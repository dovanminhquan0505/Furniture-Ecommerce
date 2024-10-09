import React from "react";
import "../seller/styles/seller-nav.css";
import { Bell } from "lucide-react";
import userIcon from "../assets/images/user-icon.png";
import { useLocation, NavLink, Link } from "react-router-dom";

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
                <div className="seller__nav__avatar">
                    <img src={userIcon} alt="User Avatar" />
                </div>
            </div>
        </nav>
    );
};

export default SellerNav;
