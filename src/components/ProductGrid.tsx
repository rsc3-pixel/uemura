import React from 'react';
import { motion } from 'framer-motion';
import type { Produto } from '../types';
import { ProductCard } from './ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  produtos: Produto[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  produtos,
  activeCategory,
  onSelectCategory
}) => {
  // Animacao da Grade
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <section className={`${styles.section} container`}>
      {/* Cabecalho da Vitrine */}
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>
          {activeCategory === 'Todas as Plantas' ? 'Nossas Plantas e Produtos' : activeCategory}
        </h2>
        <span className={styles.count}>
          {produtos.length} {produtos.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
        </span>
      </div>



      {/* Vitrine ou Estado Vazio */}
      {produtos.length > 0 ? (
        <motion.div
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {produtos.map((produto) => (
            <ProductCard key={produto.id} produto={produto} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          className={styles.emptyState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className={styles.emptyIcon}>🌱</div>
          <h3>Nenhuma planta encontrada</h3>
          <p>
            Não encontramos resultados para a sua busca ou filtro. Tente buscar termos como "Begônia", "Lírio", "Vaso" ou escolha outra categoria.
          </p>
          <button
            className={styles.resetBtn}
            onClick={() => onSelectCategory('Todas as Plantas')}
          >
            Ver catálogo completo
          </button>
        </motion.div>
      )}
    </section>
  );
};
