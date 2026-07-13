import React from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Produto } from '../types';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  produto: Produto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ produto }) => {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const isFav = isFavorite(produto.id);

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -6 }}
    >
      {/* Imagem do Produto */}
      <div className={styles.imageContainer}>
        <img src={produto.imagem} alt={produto.nome} className={styles.image} />
        
        {/* Selo de Desconto */}
        {produto.desconto && (
          <span className={styles.discountBadge}>{produto.desconto}% OFF</span>
        )}

        {/* Botao de Favoritar */}
        <motion.button
          className={`${styles.favoriteBtn} ${isFav ? styles.activeFavorite : ''}`}
          onClick={() => toggleFavorite(produto)}
          whileTap={{ scale: 0.8 }}
          aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Heart size={20} className={isFav ? styles.filledHeart : ''} />
        </motion.button>
      </div>

      {/* Detalhes do Produto */}
      <div className={styles.details}>
        <span className={styles.category}>{produto.categoria}</span>
        <h3 className={styles.title}>{produto.nome}</h3>
        {produto.tamanhoVaso && (
          <span className={styles.size}>{produto.tamanhoVaso}</span>
        )}

        {/* Precos */}
        <div className={styles.priceContainer}>
          {produto.valorAnterior ? (
            <>
              <span className={styles.currentPrice}>
                R$ {produto.preco.toFixed(2).replace('.', ',')}
              </span>
              <span className={styles.oldPrice}>
                R$ {produto.valorAnterior.toFixed(2).replace('.', ',')}
              </span>
            </>
          ) : (
            <span className={styles.currentPrice}>
              R$ {produto.preco.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>

        {/* Botao Adicionar ao Carrinho */}
        <button
          className={styles.buyBtn}
          onClick={() => addToCart(produto)}
        >
          <ShoppingCart size={18} />
          <span>Adicionar</span>
        </button>
      </div>
    </motion.div>
  );
};
