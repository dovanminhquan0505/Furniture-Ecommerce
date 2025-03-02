import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { userActions } from "../redux/slices/userSlice";
import axios from "axios";
import { toast } from "react-toastify";

const useAuth = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    const BASE_URL = "http://localhost:5000/api";

    // Verify token
    const checkTokenValidity = (token) => {
        try {
            const decoded = jwtDecode(token);
            console.log("Decoded token:", decoded);
            const currentTime = Date.now() / 1000;
            console.log("Current time (seconds):", currentTime, "Token exp:", decoded.exp);
            return decoded.exp > currentTime;
        } catch (error) {
            console.error("Token verification error:", error);
            return false;
        }
    };

    const refreshAccessToken = async () => {
        try {
            const refreshTokenValue = localStorage.getItem('refreshToken');
            if (!refreshTokenValue) {
                console.warn("No refresh token available in localStorage");
                throw new Error("No refresh token available");
            }

            console.log("Attempting to refresh token with refreshToken:", refreshTokenValue);
            const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
                refreshToken: refreshTokenValue
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            console.log("Refresh token response:", response.data);
            const { token, user } = response.data;
            
            // Đảm bảo lưu trữ nhất quán giữa các token
            localStorage.setItem('authToken', token);
            localStorage.setItem('accessToken', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            console.log("Token refreshed successfully, user:", user);
            return { token, user };
        } catch (error) {
            console.error("Failed to refresh token:", error.response?.data?.error || error.message);
            if (error.response) {
                console.log("Refresh token error response:", error.response.data);
            }
            toast.error("Failed to refresh session. Please log in again.");
            return null;
        }
    };

    // Đồng bộ giữa localStorage và Redux state
    const syncUserState = () => {
        try {
            // Kiểm tra token đã tồn tại
            const authToken = localStorage.getItem('authToken');
            const accessToken = localStorage.getItem('accessToken');
            
            // Đồng bộ giữa accessToken và authToken nếu cần
            if (authToken && !accessToken) {
                localStorage.setItem('accessToken', authToken);
            } else if (accessToken && !authToken) {
                localStorage.setItem('authToken', accessToken);
            }
            
            // Kiểm tra thông tin người dùng
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                console.log("Syncing user from localStorage to Redux:", userData);
                dispatch(userActions.setUser(userData));
                setCurrentUser(userData);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error syncing user state:", error);
            return false;
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            
            const synced = syncUserState();
            
            if (!synced) {
                const authToken = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
                const userData = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
                const refreshTokenValue = localStorage.getItem('refreshToken');

                console.log("Initializing auth - authToken:", authToken, "userData:", userData, "refreshToken exists:", !!refreshTokenValue);

                if (authToken && userData) {
                    if (checkTokenValidity(authToken)) {
                        setCurrentUser(userData);
                        dispatch(userActions.setUser(userData));
                        console.log("User authenticated from localStorage:", userData);
                    } else if (refreshTokenValue) {
                        // Token hết hạn, thử làm mới bằng refresh token
                        console.log("Access token expired, attempting to refresh...");
                        const refreshed = await refreshAccessToken();
                        if (refreshed) {
                            setCurrentUser(refreshed.user);
                            dispatch(userActions.setUser(refreshed.user));
                            console.log("User re-authenticated after token refresh:", refreshed.user);
                        } else {
                            // Nếu không làm mới được, đăng xuất
                            console.log("Failed to refresh token, logging out user");
                            clearAuthData();
                        }
                    } else {
                        // Không có refresh token, đăng xuất
                        console.log("No refresh token available, logging out user");
                        clearAuthData();
                    }
                } else {
                    clearAuthData(false); 
                }
            }
            
            setLoading(false);
        };

        const clearAuthData = (showToast = true) => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setCurrentUser(null);
            dispatch(userActions.setUser(null));
            if (showToast) {
                toast.error("Session expired. Please log in again.");
            }
        };

        initializeAuth();
    }, [dispatch]);

    return { currentUser, loading };
};

export default useAuth;