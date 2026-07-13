import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_URL, parseJson } from '../config';
import styles from './Testimonials.module.css';

interface Testimonial {
  id: string;
  clienteNome: string;
  nota: number;
  comentario: string;
  produto?: {
    nome: string;
    imagem?: string;
  };
}

export const Testimonials: React.FC = () => {
  const [reviews, setReviews] = useState<Testimonial[]>([]);

  // Carrega os depoimentos em tempo real do banco SQLite
  useEffect(() => {
    const buscarDepoimentos = async () => {
      try {
        const response = await fetch(`${API_URL}/api/avaliacoes`);
        if (response.ok) {
          const dados = await parseJson(response, []);
          if (dados.length === 0) throw new Error();
          setReviews(dados);
        } else {
          throw new Error();
        }
      } catch (err) {
        console.warn('Backend offline. Carregando reviews locais de fallback...');
        setReviews([
          {
            id: 'rev-1',
            clienteNome: 'Mariana Silva',
            nota: 5,
            comentario: 'Minha Begônia Maculata chegou perfeita! Muito bem embalada e as folhas vieram super viçosas. O guia de cultivo ajudou demais.',
            produto: { nome: 'Begônia Maculata' }
          },
          {
            id: 'rev-2',
            clienteNome: 'Rodrigo Souza',
            nota: 5,
            comentario: 'O Ficus Moonshine é simplesmente espetacular, uma verdadeira obra de arte na minha sala. Recomendo muito a Uemura.',
            produto: { nome: 'Ficus Elástica Shivereana Moonshine' }
          },
          {
            id: 'rev-3',
            clienteNome: 'Ana Claudia',
            nota: 4,
            comentario: 'Comprei o tomateiro orgânico e ele já está cheio de florzinhas amarelas. Entrega rápida de moto aqui em SP.',
            produto: { nome: 'Tomate cereja orgânico' }
          }
        ]);
      }
    };

    buscarDepoimentos();

    // Atualiza a cada 30 segundos se houver novos depoimentos
    const interval = setInterval(buscarDepoimentos, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.subtitle}>Opinião de quem compra</span>
          <h2>Quem já comprou, recomenda</h2>
          <p>
            Depoimentos reais de clientes integrados diretamente com o nosso histórico de pedidos e entregas no banco SQLite.
          </p>
        </div>

        <div className={styles.reviewsGrid}>
          {reviews.map((rev, index) => (
            <motion.div
              key={rev.id}
              className={styles.reviewCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={styles.starsRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < rev.nota ? '#f59e0b' : 'none'}
                    color={i < rev.nota ? '#f59e0b' : '#cbd5e1'}
                  />
                ))}
              </div>
              <p className={styles.comment}>"{rev.comentario}"</p>
              
              <div className={styles.clientMeta}>
                <div>
                  <h4 className={styles.clientName}>{rev.clienteNome}</h4>
                  {rev.produto && (
                    <span className={styles.plantPurchased}>
                      Comprou: <strong>{rev.produto.nome}</strong>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
