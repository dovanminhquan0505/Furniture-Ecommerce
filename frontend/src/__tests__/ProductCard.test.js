import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductCard from '../components/UI/ProductCard';
import { getProducts } from '../firebase.config';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
    i: ({ children, ...props }) => <i {...props}>{children}</i>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
}));

// Tạo mock store
const mockStore = configureStore([]);

// Set global timeout
jest.setTimeout(15000);

describe('ProductCard Component with Firestore', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      wishlist: {
        wishListItems: [],
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('Product name and product price in product list', async () => {
    const targetProductName = 'Smart Tivi';
    const targetPrice = 200;

    const products = await getProducts();
    const matchedProduct = products.find(
      (product) =>
        product.productName === targetProductName &&
        Number(product.price) === targetPrice
    );

    if (!matchedProduct) {
      throw new Error(
        `Test failed: No product found with name "${targetProductName}" and price $${targetPrice} in Firestore`
      );
    }

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ProductCard item={matchedProduct} />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(targetProductName)).toBeInTheDocument();
    }, { timeout: 10000 });

    await waitFor(() => {
      expect(screen.getByText(`$${targetPrice}`)).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});