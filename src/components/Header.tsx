import React, { useState } from 'react';
import { Menu, X, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import styles from './Header.module.css';

interface HeaderProps {
  onSearch: (searchTerm: string) => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onCartOpen: () => void;
  onFavoritesOpen: () => void;
  onHistoryOpen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  activeCategory,
  onSelectCategory,
  onCartOpen,
  onFavoritesOpen,
  onHistoryOpen
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const { cartCount } = useCart();
  const { favorites } = useFavorites();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    onSearch(val);
  };

  const handleCategoryClick = (category: string) => {
    onSelectCategory(category);
    setIsMenuOpen(false);
  };

  const categories = ['Todas as Plantas', 'Flores e Plantas', 'Vasos', 'Acessórios'];

  return (
    <header className={styles.header}>
      {/* Barra de Avisos no Topo */}
      <div className={styles.topBar}>
        <p>🚚 Entrega rápida no mesmo dia para toda a Grande São Paulo</p>
      </div>

      <div className={styles.navBar}>
        <div className={`${styles.navContainer} container`}>
          {/* Menu Hamburger para Mobile */}
          <button
            className={styles.menuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu principal"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo da Marca */}
          <div className={styles.logo} onClick={() => handleCategoryClick('Todas as Plantas')}>
            <img
              src="https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/layout/imagens/template7/ba19736e-9e62-48df-a6e6-438ab97edd00.png"
              alt="Logo Uemura Flores e Plantas"
            />
          </div>

          {/* Barra de Busca - Desktop */}
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Buscar plantas, vasos, adubos..."
              value={searchVal}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>

          {/* Acoes: Meus Pedidos, Favoritos e Carrinho */}
          <div className={styles.actions}>
            {/* Area do Cliente (Historico/Rastreamento) */}
            <button
              className={styles.actionBtn}
              onClick={onHistoryOpen}
              aria-label="Meus Pedidos / Área do Cliente"
              title="Meus Pedidos"
            >
              <User size={24} />
            </button>

            {/* Favoritos */}
            <button
              className={styles.actionBtn}
              onClick={onFavoritesOpen}
              aria-label="Lista de desejos"
              title="Favoritos"
            >
              <Heart size={24} className={favorites.length > 0 ? styles.filledHeart : ''} />
              {favorites.length > 0 && (
                <span className={styles.badge}>{favorites.length}</span>
              )}
            </button>

            {/* Carrinho */}
            <button
              className={styles.actionBtn}
              onClick={onCartOpen}
              aria-label="Carrinho de compras"
              title="Sacola de Compras"
            >
              <ShoppingBag size={24} />
              {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Busca - Mobile */}
      <div className={`${styles.mobileSearch} container`}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Buscar no catálogo..."
            value={searchVal}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Menu Lateral / Navegacao Mobile */}
      <nav className={`${styles.navMenu} ${isMenuOpen ? styles.menuOpen : ''}`}>
        <ul className={styles.menuList}>
          {categories.map((cat) => (
            <li key={cat} className={styles.menuItem}>
              <button
                onClick={() => handleCategoryClick(cat)}
                className={`${styles.menuLink} ${
                  activeCategory === cat ? styles.activeCategory : ''
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
          {/* Item extra para Meus Pedidos no Mobile */}
          <li className={`${styles.menuItem} ${styles.mobileOnly}`}>
            <button
              onClick={() => {
                onHistoryOpen();
                setIsMenuOpen(false);
              }}
              className={`${styles.menuLink} ${styles.mobileOnlyLink}`}
            >
              <User size={18} />
              <span>Meus Pedidos</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Overlay para fechar o menu mobile */}
      {isMenuOpen && (
        <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />
      )}
    </header>
  );
};
