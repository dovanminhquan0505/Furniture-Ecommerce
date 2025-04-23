const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Authentication && User
export const registerUser = async (userData) => {
    try {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to register user");
        }
        return await response.json();
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to login user");
        }
        return await response.json();
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        const response = await fetch(`${BASE_URL}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to logout user");
        }
        return await response.json();
    } catch (error) {
        console.error("Error logging out:", error);
        throw error;
    }
};

export const googleLogin = async (idToken) => {
    try {
        const response = await fetch(`${BASE_URL}/auth/google-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to login with Google");
        }
        return { success: true };
    } catch (error) {
        console.error("Error logging in with Google:", error);
        throw error;
    }
};

export const getUserById = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/users/${id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch user");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
    }
};

export const getUserProfileById = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/users/${id}/profile`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to fetch user profile"
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

export const updateUserById = async (id, updateData) => {
    try {
        const response = await fetch(`${BASE_URL}/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update user");
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
};

export const updateUserPhoto = async (id, photoURL) => {
    try {
        const response = await fetch(`${BASE_URL}/users/${id}/photo`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoURL }),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update user photo");
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating user photo:", error);
        throw error;
    }
};

export const updateUserPassword = async (id, newPassword) => {
    try {
        const response = await fetch(`${BASE_URL}/users/${id}/password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword }),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update password");
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating password:", error);
        throw error;
    }
};

export const getUserOrders = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/users/${id}/orders`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch user orders");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching user orders:", error);
        throw error;
    }
};

export const deleteUserOrder = async (orderId) => {
    try {
        const response = await fetch(`${BASE_URL}/users/orders/${orderId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete user");
        }
        return await response.json();
    } catch (error) {
        console.error("Error deleting order:", error);
        throw error;
    }
};

export const uploadFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${BASE_URL}/upload`, {
            method: "POST",
            body: formData,
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to upload file");
        }

        return await response.json();
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

export const refreshToken = async () => {
    try {
        const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to refresh token");
        }
        return await response.json();
    } catch (error) {
        console.error("Error refreshing token:", error);
        throw error;
    }
};

export const getAllUsers = async () => {
    try {
        const response = await fetch(`${BASE_URL}/users/`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch all users");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw error;
    }
};

export const fetchProduct = async (productId) => {
    try {
        const response = await fetch(`${BASE_URL}/products/${productId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch product");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching product:", error);
        throw error;
    }
};

export const updateProduct = async (productId, updateData) => {
    try {
        const response = await fetch(`${BASE_URL}/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update product");
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

export const createProduct = async (sellerId, productData) => {
    try {
        const response = await fetch(
            `${BASE_URL}/sellers/${sellerId}/products`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(productData),
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.error ||
                    `Failed to create product: ${response.status}`
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
};

// Seller Info for Product Details
export const fetchSellerInfoByProduct = async (sellerId) => {
    try {
        const response = await fetch(
            `${BASE_URL}/products/seller/${sellerId}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Failed to fetch seller info: ${
                    errorData.message || response.statusText
                }`
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching seller info by product:", error);
        throw error;
    }
};

/* Seller */
export const registerSeller = async (sellerData) => {
    try {
        const response = await fetch(`${BASE_URL}/auth/seller/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(sellerData),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to register seller");
        }
        return await response.json();
    } catch (error) {
        console.error("Error registering seller:", error);
        throw error;
    }
};

export const getSellerById = async (sellerId) => {
    try {
        const response = await fetch(`${BASE_URL}/sellers/${sellerId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch seller info");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching seller info:", error);
        throw error;
    }
};

export const fetchSellerInfo = async (sellerId) => {
    try {
        const response = await fetch(`${BASE_URL}/sellers/${sellerId}/store`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Failed to fetch seller info: ${
                    errorData.message || response.statusText
                }`
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching seller info:", error);
        throw error;
    }
};

export const updateSellerInfo = async (sellerId, updateData) => {
    try {
        const response = await fetch(`${BASE_URL}/sellers/${sellerId}/store`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to update seller info"
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating seller info:", error);
        throw error;
    }
};

export const fetchSellerProducts = async (sellerId) => {
    try {
        const response = await fetch(
            `${BASE_URL}/sellers/${sellerId}/products`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.error ||
                    `Failed to fetch seller products: ${response.status}`
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching seller products:", error);
        throw error;
    }
};

export const deleteProduct = async (productId) => {
    try {
        const response = await fetch(`${BASE_URL}/sellers/${productId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete product");
        }
        return await response.json();
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};

export const fetchSellerOrders = async (sellerId) => {
    try {
        const response = await fetch(`${BASE_URL}/sellers/${sellerId}/orders`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to fetch seller orders"
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching seller orders:", error);
        throw error;
    }
};

export const deleteOrder = async (sellerId, orderId) => {
    try {
        const response = await fetch(
            `${BASE_URL}/sellers/${sellerId}/orders/${orderId}`,
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete order");
        }
        return await response.json();
    } catch (error) {
        console.error("Error deleting order:", error);
        throw error;
    }
};

export const cancelOrder = async (orderId, subOrderId, data) => {
    try {
        const response = await fetch(`${BASE_URL}/orders/${orderId}/cancel/${subOrderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to cancel order");
        }
        return response.json();
    } catch (error) {
        throw new Error(error.message);
    }
};

export const processCancelRequest = async (orderId, subOrderId, action) => {
    try {
        const response = await fetch(`${BASE_URL}/orders/${orderId}/cancel/process/${subOrderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to process cancel request");
        }
        return await response.json();
    } catch (error) {
        console.error("Error processing cancel request:", error);
        throw error;
    }
};

export const getRefundDisputes = async () => {
    try {
        const response = await fetch(`${BASE_URL}/admin/refund-disputes`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch refund disputes");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching refund disputes:", error);
        throw error;
    }
};

export const resolveRefundDispute = async (orderId, subOrderId, action) => {
    try {
        const response = await fetch(`${BASE_URL}/admin/refund-disputes/${orderId}/${subOrderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
            credentials: "include",
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to resolve refund dispute");
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error resolving refund dispute:", error);
        throw error;
    }
};

export const appealRefund = async (orderId, subOrderId, appealReason) => {
    try {
        const response = await fetch(`${BASE_URL}/orders/${orderId}/sub-orders/${subOrderId}/appeal`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ reason: appealReason }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to submit appeal");
        }

        return await response.json();
    } catch (error) {
        console.error("Error submitting appeal:", error);
        throw error;
    }
};

export const customerConfirmReturn = async (orderId, subOrderId) => {
    try {
        const response = await fetch(`${BASE_URL}/orders/${orderId}/refund/confirm-return/${subOrderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to confirm return");
        }
        return await response.json();
    } catch (error) {
        console.error("Error confirming return:", error);
        throw error;
    }
};

export const getDashboardStats = async (sellerId) => {
    try {
        const response = await fetch(
            `${BASE_URL}/sellers/${sellerId}/dashboard`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to fetch dashboard stats"
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
};

export const getSellerNotifications = async (sellerId) => {
    try {
        const response = await fetch(`${BASE_URL}/sellers/${sellerId}/notifications`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch notifications");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw error;
    }
};

export const markNotificationAsRead = async (sellerId, notificationId) => {
    try {
        const response = await fetch(
            `${BASE_URL}/sellers/${sellerId}/notifications/${notificationId}/read`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to mark notification as read"
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error marking notification as read:", error);
        throw error;
    }
};

export const getSellerIdByUserId = async (userId) => {
    try {
        const response = await fetch(`${BASE_URL}/sellers/by-user/${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch seller ID");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching seller ID by user ID:", error);
        throw error;
    }
};

/* Review for Product Details */
export const addReview = async (productId, reviewData) => {
    try {
        const response = await fetch(
            `${BASE_URL}/products/${productId}/reviews`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reviewData),
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to add review");
        }
        return await response.json();
    } catch (error) {
        console.error("Error adding review:", error);
        throw error;
    }
};

export const deleteReview = async (
    productId,
    { review, userId, userSellerId }
) => {
    try {
        const response = await fetch(
            `${BASE_URL}/products/${productId}/reviews`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ review, userId, userSellerId }),
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete review");
        }
        return await response.json();
    } catch (error) {
        console.error("Error deleting review:", error);
        throw error;
    }
};

export const toggleLikeReview = async (productId, reviewIndex, userId) => {
    try {
        const response = await fetch(
            `${BASE_URL}/products/${productId}/reviews/like`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reviewIndex, userId }),
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to toggle like");
        }
        return await response.json();
    } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
    }
};

export const addReplyToReview = async (productId, reviewIndex, replyData) => {
    try {
        const response = await fetch(
            `${BASE_URL}/products/${productId}/reviews/reply`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reviewIndex,
                    ...replyData,
                }),
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to add reply");
        }
        return await response.json();
    } catch (error) {
        console.error("Error adding reply:", error);
        throw error;
    }
};

export const toggleLikeReply = async (
    productId,
    reviewIndex,
    replyIndex,
    userId
) => {
    try {
        const response = await fetch(
            `${BASE_URL}/products/${productId}/reviews/reply/like`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reviewIndex, replyIndex, userId }),
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to toggle like for reply"
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error toggling like for reply:", error);
        throw error;
    }
};

// Orders
export const createOrder = async (orderData) => {
    try {
        const response = await fetch(`${BASE_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create order");
        }
        return await response.json();
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    try {
        const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to fetch order details"
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching order details:", error);
        throw error;
    }
};

export const updateOrder = async (orderId, updateData) => {
    try {
        const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update order");
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating order:", error);
        throw error;
    }
};

// Admin
export const getAdminProfileById = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/admin/${id}/profile`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to fetch admin profile"
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching admin profile:", error);
        throw error;
    }
};

export const updateAdminProfile = async (id, profileData) => {
    try {
        const response = await fetch(`${BASE_URL}/admin/${id}/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profileData),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to update admin profile."
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating admin profile:", error);
        throw error;
    }
};

export const updateAdminPhoto = async (id, photoURL) => {
    try {
        const response = await fetch(`${BASE_URL}/admin/${id}/photo`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoURL }),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to admin photo.");
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating admin photo:", error);
        throw error;
    }
};

export const updateAdminPassword = async (id, newPassword) => {
    try {
        const response = await fetch(`${BASE_URL}/admin/${id}/password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword }),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch password");
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating password:", error);
        throw error;
    }
};

export const getPendingOrders = async () => {
    try {
        const response = await fetch(`${BASE_URL}/admin/pending-orders`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to fetch pending orders"
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching pending orders:", error);
        throw error;
    }
};

export const approvePendingOrder = async (id) => {
    try {
        const response = await fetch(
            `${BASE_URL}/admin/pending-orders/${id}/approve`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to approve pending order."
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error approving pending order:", error);
        throw error;
    }
};

export const rejectPendingOrder = async (id) => {
    try {
        const response = await fetch(
            `${BASE_URL}/admin/pending-orders/${id}/reject`,
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to reject pending order."
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error rejecting pending order:", error);
        throw error;
    }
};

export const getAllOrdersAdmin = async () => {
    try {
        const response = await fetch(`${BASE_URL}/admin/orders`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch orders");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

export const getAllSellersAdmin = async () => {
    try {
        const response = await fetch(`${BASE_URL}/admin/sellers`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch sellers");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching sellers:", error);
        throw error;
    }
};

export const deleteSellerAdmin = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/admin/sellers/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete seller");
        }
        return await response.json();
    } catch (error) {
        console.error("Error deleting seller:", error);
        throw error;
    }
};

export const getAllUsersAdmin = async () => {
    try {
        const response = await fetch(`${BASE_URL}/admin/users`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch users");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const deleteUserAdmin = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/admin/users/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete user");
        }
        return await response.json();
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

export const getDashboardDataAdmin = async () => {
    try {
        const response = await fetch(`${BASE_URL}/admin/dashboard`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to fetch dashboard data."
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
    }
};

//Stripe payment method
export const createStripePaymentIntent = async (orderId, amount) => {
    try {
        const response = await fetch(
            `${BASE_URL}/orders/${orderId}/stripe-payment-intent`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
                credentials: "include",
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Failed to create Stripe payment intent"
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error creating Stripe payment intent:", error);
        throw error;
    }
};

//Refund
export const requestRefund = async (orderId, subOrderId, refundData) => {
    try {
        const response = await fetch(`${BASE_URL}/orders/${orderId}/refund/${subOrderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(refundData),
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to request refund");
        }
        return await response.json();
    } catch (error) {
        console.error("Error requesting refund:", error);
        throw error;
    }
};

export const processRefund = async (orderId, subOrderId, data) => {
    try {
        const response = await fetch(`${BASE_URL}/orders/${orderId}/refund/${subOrderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data), 
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to process refund");
        }
        return await response.json();
    } catch (error) {
        console.error("Error processing refund:", error);
        throw error;
    }
};
