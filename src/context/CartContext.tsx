import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Produto, ItemCarrinho } from '../types';

interface CartContextType {
  cartItems: ItemCarrinho[];
  addToCart: (produto: Produto) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<ItemCarrinho[]>(() => {
    const localData = localStorage.getItem('uemura_carrinho');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('uemura_carrinho', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (produto: Produto) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.produto.id === produto.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prevItems, { produto, quantidade: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.produto.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.produto.id === productId ? { ...item, quantidade: quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantidade, 0);

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.produto.preco * item.quantidade,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};
