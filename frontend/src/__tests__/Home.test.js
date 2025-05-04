import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import Home from '../Screens/Home';

// Mock Services component to avoid rendering issues
jest.mock('../services/Services', () => () => <div />);

// Mock react-toastify (not needed for API call test, but kept for consistency)
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock framer-motion (not needed, but kept for consistency)
jest.mock('framer-motion', () => ({
  motion: {
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
    i: ({ children, ...props }) => <i {...props}>{children}</i>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));

// Tạo mock store
const mockStore = configureStore([]);

// Set global timeout
jest.setTimeout(30000);

describe('Home Integration with API and Firestore', () => {
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

  test('Calls API /products endpoint', async () => {
    const originalFetch = global.fetch;
    const mockFetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
    global.fetch = mockFetch;

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5000/api/products'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
      );
    }, { timeout: 30000 });

    global.fetch = originalFetch;
  });
});