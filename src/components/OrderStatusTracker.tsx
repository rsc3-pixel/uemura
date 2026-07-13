import React from 'react';
import { ClipboardList, CheckCircle2, Leaf, Truck, Smile } from 'lucide-react';
import styles from './OrderStatusTracker.module.css';

interface OrderStatusTrackerProps {
  status: string;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ status }) => {
  const etapas = [
    { key: 'Pendente', label: 'Pendente', icon: ClipboardList, desc: 'Aguardando PIX' },
    { key: 'Aprovado', label: 'Pago', icon: CheckCircle2, desc: 'Confirmado' },
    { key: 'Preparando', label: 'Preparando', icon: Leaf, desc: 'Embalando com carinho' },
    { key: 'Em Rota', label: 'Em Rota', icon: Truck, desc: 'Motoboy a caminho' },
    { key: 'Entregue', label: 'Entregue', icon: Smile, desc: 'Finalizado' }
  ];

  // Identifica a posicao do status atual na linha do tempo
  const indexStatusAtual = etapas.findIndex((e) => e.key === status);

  return (
    <div className={styles.trackerContainer}>
      <div className={styles.stepsWrapper}>
        {etapas.map((etapa, idx) => {
          const IconComponent = etapa.icon;
          const isCompleted = idx <= indexStatusAtual;
          const isActive = idx === indexStatusAtual;

          return (
            <div
              key={etapa.key}
              className={`${styles.stepItem} ${isCompleted ? styles.completed : ''} ${
                isActive ? styles.active : ''
              }`}
            >
              {/* Conector de Linha */}
              {idx > 0 && (
                <div
                  className={`${styles.connectorLine} ${
                    idx <= indexStatusAtual ? styles.completedLine : ''
                  }`}
                />
              )}

              {/* Botão de Circulo com Ícone */}
              <div className={styles.iconCircle} title={etapa.label}>
                <IconComponent size={18} />
              </div>

              {/* Textos */}
              <div className={styles.stepLabels}>
                <span className={styles.stepLabel}>{etapa.label}</span>
                <span className={styles.stepDesc}>{etapa.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
