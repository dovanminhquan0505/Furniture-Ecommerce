const BASE_URL = 'http://localhost:5000/api';

// Authentication && User
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error('Failed to register user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      throw new Error('Failed to login');
    }
    return await response.json();
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logoutUser = async (token) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to logout');
    }
    return await response.json();
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const googleLogin = async (idToken) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) {
      throw new Error('Failed to login with Google');
    }
    return await response.json();
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw error;
  }
};

export const getUserById = async (token, id) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const getUserProfileById = async (token, id) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${id}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserById = async (token, id, updateData) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const refreshToken = async (refreshToken) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    return await response.json();
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

export const getAllUsers = async (token) => {
  try {
    const response = await fetch(`${BASE_URL}/users/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch all users');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

export const fetchProduct = async (productId) => {
    try {
      const response = await fetch(`${BASE_URL}/products/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
};

export const fetchSellerInfo = async (sellerId) => {
    try {
      const response = await fetch(`${BASE_URL}/products/seller/${sellerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch seller info');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching seller info:', error);
      throw error;
    }
};

export const addReview = async (productId, reviewData) => {
    try {
      const response = await fetch(`${BASE_URL}/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      if (!response.ok) {
        throw new Error('Failed to add review');
      }
      return await response.json();
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
};

export const deleteReview = async (productId, review) => {
    try {
      const response = await fetch(`${BASE_URL}/products/${productId}/reviews`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete review');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
};

export const toggleLikeReview = async (productId, reviewIndex, userId) => {
    try {
      const response = await fetch(`${BASE_URL}/products/${productId}/reviews/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewIndex, userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }
      return await response.json();
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
};

export const addReplyToReview = async (productId, reviewIndex, replyData) => {
    try {
      const response = await fetch(`${BASE_URL}/products/${productId}/reviews/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewIndex,
          ...replyData
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to add reply');
      }
      return await response.json();
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
};

export const toggleLikeReply = async (productId, reviewIndex, replyIndex, userId) => {
    try {
      const response = await fetch(`${BASE_URL}/products/${productId}/reviews/reply/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewIndex, replyIndex, userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to toggle like for reply');
      }
      return await response.json();
    } catch (error) {
      console.error('Error toggling like for reply:', error);
      throw error;
    }
};

// Orders
export const createOrder = async (orderData) => {
  try {
      const response = await fetch(`${BASE_URL}/orders`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
      });
      if (!response.ok) {
          throw new Error('Failed to create order');
      }
      return await response.json();
  } catch (error) {
      console.error('Error creating order:', error);
      throw error;
  }
};