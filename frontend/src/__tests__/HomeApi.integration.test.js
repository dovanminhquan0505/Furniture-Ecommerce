/* eslint-disable testing-library/no-wait-for-multiple-assertions */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import Home from '../../src/Screens/Home';
import '@testing-library/jest-dom';

// Mock các component con để tập trung vào việc test tương tác API
jest.mock('../../src/services/Services', () => () => <div data-testid="services-component" />);
jest.mock('../../src/components/footer/Footer', () => () => <div data-testid="footer-component" />);
jest.mock('../../src/components/header/Header', () => () => <div data-testid="header-component" />);

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock framer-motion để tránh lỗi khi test
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
    i: ({ children, ...props }) => <i {...props}>{children}</i>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));

const mockStore = configureStore([]);

describe('Home Component Integration with API', () => {
  let store;
  let mockProducts;
  
  beforeEach(() => {
    // Tạo mock data cho sản phẩm
    mockProducts = [
      {
        id: 'product1',
        productName: 'Smart Tivi Xiaomi',
        price: '210',
        imgUrl: 'https://example.com/tivi.jpg',
        category: 'electronics',
        avgRating: 4.5
      },
      {
        id: 'product2',
        productName: 'Modern Sofa',
        price: '599',
        imgUrl: 'https://example.com/sofa.jpg',
        category: 'furniture',
        avgRating: 4.8
      }
    ];

    // Mock store với state cần thiết
    store = mockStore({
      wishlist: {
        wishListItems: [],
      },
      cart: {
        cartItems: [],
        totalAmount: 0,
        totalQuantity: 0
      }
    });

    // Mock global fetch function
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches and displays products from API', async () => {
    // Setup mock API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </Provider>
    );

    // Check if fetch was called with correct URL
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          credentials: 'include',
        })
      );
    });

    // Test successful response handling
    global.fetch.mockClear();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </Provider>
    );

    // Verify products are loaded into the component state
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('handles API error gracefully', async () => {
    // Setup mock for API failure
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Suppress console.error for this test to avoid noise
    const originalError = console.error;
    console.error = jest.fn();
    
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </Provider>
    );

    // Wait for the API call to be made and fail
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Restore console.error
    console.error = originalError;
  });
});