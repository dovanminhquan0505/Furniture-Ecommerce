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
import AddProducts from "../admin/AddProducts";
import AllProducts from "../admin/AllProducts";
import Dashboard from "../admin/Dashboard";
import Users from "../admin/Users";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import Orders from "../admin/Orders";

const Routers = () => {
    //Link URL to views for each router
    return (
        <Routes>
            <Route path="/" element={<Navigate to="home" />} />
            <Route path="home" element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="shop/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />

            <Route path="/*" element={<ProtectedRoute />}>
                <Route path="checkout" element={<Checkout />} />
            </Route>

            <Route path="/admin/*" element={<ProtectedAdminRoute />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="all-products" element={<AllProducts />} />
                <Route path="add-product" element={<AddProducts />} />
                <Route path="users" element={<Users />} />
                <Route path="orders" element={<Orders />} />
            </Route>
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<SignUp />} />
        </Routes>
    );
};

export default Routers;
