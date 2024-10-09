import React from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Routers from "../../routers/Routers";
import AdminNav from "../../admin/AdminNav";
import { useLocation } from "react-router-dom";
import SellerNav from "../../seller/SellerNav";

const Layout = () => {
    const location = useLocation();

    const renderNavigation = () => {
        if (location.pathname.startsWith("/admin")) {
            return <AdminNav />;
        } else if (
            location.pathname.startsWith("/seller") &&
            location.pathname !== "/seller/signup"
        ) {
            return <SellerNav />;
        } else {
            return <Header />;
        }
    };

    const shouldShowFooter = () => {
        return !location.pathname.startsWith("/seller") || location.pathname === "/seller/signup";
    };

    return (
        <>
            {renderNavigation()}
            <div>
                <Routers />
            </div>
            {shouldShowFooter() && <Footer />}
        </>
    );
};

export default Layout;
