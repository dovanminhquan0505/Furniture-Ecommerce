const BASE_URL = 'http://localhost:5000/api';

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