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
import Placeorder from "../Screens/Placeorder";
import EditProduct from "../admin/EditProduct";
import ProfileAdmin from "../admin/ProfileAdmin";
import ProfileUser from "../Screens/ProfileUser";
import WishList from "../Screens/WishList";
import LoginSeller from "../seller/login-seller";
import SignupSeller from "../seller/signup-seller";
import DashboardSeller from "../seller/dashboard-seller";
import PendingOrders from "../admin/PendingOrders";
import ProductsSeller from "../seller/ProductsSeller";
import OrdersSeller from "../seller/OrdersSeller";
import StoreInformation from "../seller/StoreInformation";
import ProtectedSeller from "./ProtectedSeller";

const Routers = () => {
    //Link URL to views for each router
    return (
        <Routes>
            <Route path="/" element={<Navigate to="home" />} />
            <Route path="home" element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="shop/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="wishlist" element={<WishList />} />

            <Route path="/*" element={<ProtectedRoute />}>
                <Route path="profile" element={<ProfileUser />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="placeorder/:orderId" element={<Placeorder />} />
                <Route path="seller/signup" element={<SignupSeller />} />
            </Route>

            <Route path="/seller/*" element={<ProtectedSeller />}>
                <Route path="login" element={<LoginSeller />} />
                <Route path="dashboard" element={<DashboardSeller />} />
                <Route path="all-products" element={<ProductsSeller />}/>
                <Route path="orders" element={<OrdersSeller />}/>
                <Route path="store-information" element={<StoreInformation />}/>
            </Route>

            <Route path="/admin/*" element={<ProtectedAdminRoute />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="all-products" element={<AllProducts />} />
                <Route path="edit-product/:productId" element={<EditProduct />} />
                <Route path="add-product" element={<AddProducts />} />
                <Route path="users" element={<Users />} />
                <Route path="orders" element={<Orders />} />
                <Route path="pending-orders" element={<PendingOrders />} />
                <Route path="profile" element={<ProfileAdmin />} />
            </Route>
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<SignUp />} />
        </Routes>
    );
};

export default Routers;
