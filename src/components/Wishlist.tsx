import React from 'react';
import { X, Trash2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import styles from './Wishlist.module.css';

interface WishlistProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Wishlist: React.FC<WishlistProps> = ({ isOpen, onClose }) => {
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  const handleAddToCart = (produto: any) => {
    addToCart(produto);
    // Remove dos favoritos automaticamente ao mandar pro carrinho, se desejar, 
    // ou mantem lá. Vamos manter para o usuario decidir.
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay escuro */}
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Painel da Lista de Desejos (Entra pela esquerda) */}
          <motion.div
            className={styles.panel}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.35 }}
          >
            {/* Cabecalho */}
            <div className={styles.header}>
              <h2>Minhas Plantas Favoritas</h2>
              <button onClick={onClose} className={styles.closeBtn} aria-label="Fechar favoritos">
                <X size={24} />
              </button>
            </div>

            {/* Conteudo */}
            <div className={styles.content}>
              {favorites.length > 0 ? (
                <div className={styles.itemsList}>
                  {favorites.map((produto) => (
                    <div key={produto.id} className={styles.itemCard}>
                      <img src={produto.imagem} alt={produto.nome} className={styles.itemImage} />
                      <div className={styles.itemInfo}>
                        <h4 className={styles.itemName}>{produto.nome}</h4>
                        <span className={styles.itemSize}>{produto.tamanhoVaso}</span>
                        <span className={styles.itemPrice}>
                          R$ {produto.preco.toFixed(2).replace('.', ',')}
                        </span>
                        
                        {/* Acao rapida de compra */}
                        <button
                          onClick={() => handleAddToCart(produto)}
                          className={styles.addBtn}
                        >
                          <ShoppingCart size={14} />
                          <span>Mandar pra sacola</span>
                        </button>
                      </div>

                      {/* Acao de remover dos favoritos */}
                      <button
                        onClick={() => toggleFavorite(produto)}
                        className={styles.removeBtn}
                        aria-label="Remover dos favoritos"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Estado Vazio */
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>💚</div>
                  <h3>Sua lista está vazia</h3>
                  <p>Salve as plantas que você mais gostou clicando no coração para que elas apareçam aqui.</p>
                  <button onClick={onClose} className={styles.continueBtn}>
                    Explorar catálogo
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
