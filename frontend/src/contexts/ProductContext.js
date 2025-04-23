import React, { createContext, useState, useContext } from 'react';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
 
  const updateProducts = (newProducts) => {
    setProducts(newProducts);
  };

  const addProductImproved = (product) => {
    setProducts(prevProducts => {
      const existingProduct = prevProducts.find(p => p.id === product.id);
      if (existingProduct) {
        return prevProducts.map(p => p.id === product.id ? {...p, ...product} : p);
      } else {
        return [...prevProducts, product];
      }
    });
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      addProduct: addProductImproved, 
      updateProducts 
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => useContext(ProductContext);