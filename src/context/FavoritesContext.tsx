import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Produto } from '../types';

interface FavoritesContextType {
  favorites: Produto[];
  toggleFavorite: (produto: Produto) => void;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Produto[]>(() => {
    const localData = localStorage.getItem('uemura_favoritos');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('uemura_favoritos', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (produto: Produto) => {
    setFavorites((prevFavorites) => {
      const isAlreadyFav = prevFavorites.some((item) => item.id === produto.id);
      if (isAlreadyFav) {
        return prevFavorites.filter((item) => item.id !== produto.id);
      }
      return [...prevFavorites, produto];
    });
  };

  const isFavorite = (productId: string) => {
    return favorites.some((item) => item.id === productId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites deve ser usado dentro de um FavoritesProvider');
  }
  return context;
};
