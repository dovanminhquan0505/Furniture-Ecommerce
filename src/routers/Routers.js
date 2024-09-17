import { Routes, Route, Navigate } from "react-router-dom";

//Import Screens
import Home from "../Screens/Home";
import Shop from "../Screens/Shop";
import Cart from "../Screens/Cart";
import ProductDetails from "../Screens/ProductDetails";
import Checkout from "../Screens/Checkout";
import Login from "../Screens/Login";
import SignUp from "../Screens/SignUp";
import ProtectedRoute from "./ProtectedRoute";

const Routers = () => {
    //Link URL to views for each router
    return (
        <Routes>
            <Route path="/" element={<Navigate to="home" />} />
            <Route path="home" element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="shop/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route
                path="checkout"
                element={
                    <ProtectedRoute>
                        <Checkout />
                    </ProtectedRoute>
                }
            />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<SignUp />} />
        </Routes>
    );
};

export default Routers;
