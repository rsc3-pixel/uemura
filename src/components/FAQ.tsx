import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, HelpCircle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './FAQ.module.css';

interface FAQProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  pergunta: string;
  resposta: string;
}

export const FAQ: React.FC<FAQProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'cliente' | 'vendedor'>('cliente');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqsCliente: FAQItem[] = [
    {
      pergunta: 'Como funciona o preenchimento automático de endereço?',
      resposta: 'Basta digitar o seu CEP de 8 dígitos no campo de simulação de frete do carrinho de compras e clicar no botão calcular. Nosso sistema consultará automaticamente o serviço ViaCEP e preencherá a sua Rua, Bairro e Cidade na tela de confirmação, bastando você digitar apenas o número do imóvel.'
    },
    {
      pergunta: 'Por que o site bloqueia a compra de plantas para outros estados?',
      resposta: 'Plantas vivas são perecíveis e sensíveis a longos períodos sem luz e água dentro de caixas de transporte fechadas. Por isso, para garantir que as espécies cheguem saudáveis, entregamos plantas vivas apenas na Grande São Paulo por meio de nossa entrega expressa rápida de carro ou motoboy. Caso seu CEP seja de fora, remova as plantas do carrinho para liberar o envio de vasos e acessórios pelos Correios.'
    },
    {
      pergunta: 'Quais são as formas de pagamento disponíveis?',
      resposta: 'Aceitamos pagamentos instantâneos por PIX Dinâmico. Ao finalizar a sua compra, o site gerará um QR Code oficial do Mercado Pago na tela com validade de testes, além de um código copia e cola para transferência rápida.'
    },
    {
      pergunta: 'Como posso acompanhar a entrega do meu pedido?',
      resposta: 'Na parte superior do site, clique no botão de usuário (👤) ou no botão "Meus Pedidos" para acessar a sua Área do Cliente. Informe o número de telefone de cadastro e o sistema listará o histórico de todas as suas compras com uma barra de rastreamento do status em tempo real.'
    },
    {
      pergunta: 'Como faço para avaliar o meu produto?',
      resposta: 'Quando o status de entrega do seu pedido for atualizado para "Entregue" na Área do Cliente, o site liberará automaticamente um formulário de estrelas (1 a 5) e comentários para você compartilhar a sua experiência com outros clientes no rodapé da página.'
    }
  ];

  const faqsVendedor: FAQItem[] = [
    {
      pergunta: 'Como gerenciar os pedidos e atualizar o status da entrega?',
      resposta: 'Na Área do Cliente de cada pedido, há botões simuladores administrativos exclusivos para testes da equipe (Preparar Pedido, Despachar e Confirmar Entrega). Ao clicar em qualquer um deles, o servidor Node.js atualiza o SQLite imediatamente, enviando alertas em tempo real na tela do cliente.'
    },
    {
      pergunta: 'Onde ficam gravadas as informações de cuidados das plantas?',
      resposta: 'Todas as dicas de rega, iluminação e adubação estão armazenadas na tabela "Produto" do banco de dados SQLite. Elas são carregadas automaticamente na Área do Cliente quando o comprador visualiza o histórico de compras, garantindo que ele saiba exatamente como cuidar da planta pós-venda.'
    },
    {
      pergunta: 'Como funciona a liquidação automática do pagamento?',
      resposta: 'Quando o cliente efetua a transferência do PIX, o Mercado Pago dispara um aviso para o nosso endpoint de Webhook (/api/webhooks/pagamento). O servidor verifica a transação de forma segura e altera o status do pedido para "Aprovado" instantaneamente no SQLite sem necessidade de interação humana.'
    },
    {
      pergunta: 'Como criar cupons de desconto para campanhas de marketing?',
      resposta: 'Os cupons promocionais são cadastrados diretamente na tabela "Cupom" do banco de dados (como os cupons padrões UEMURA10 e PLANTAS15). O carrinho de compras envia os códigos inseridos pelo cliente para validação segura na API do servidor backend, impedindo adulterações.'
    },
    {
      pergunta: 'Como garantir a segurança no manuseio de plantas no despacho?',
      resposta: 'Seguindo as boas práticas operacionais, as plantas devem ser transportadas em embalagens abertas verticalmente (sacolas ecológicas largas ou berços de papelão abertos) e nunca em caixas fechadas, garantindo luminosidade e respiração adequada durante o trajeto.'
    }
  ];

  const currentFaqs = activeTab === 'cliente' ? faqsCliente : faqsVendedor;

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Painel Central de Ajuda */}
          <motion.div
            className={styles.faqPanel}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35 }}
          >
            {/* Cabecalho */}
            <div className={styles.header}>
              <div className={styles.headerTitle}>
                <HelpCircle size={22} className={styles.headerIcon} />
                <h2>Central de Ajuda Uemura</h2>
              </div>
              <button onClick={onClose} className={styles.closeBtn} aria-label="Fechar Central de Ajuda">
                <X size={24} />
              </button>
            </div>

            {/* Conteudo */}
            <div className={styles.content}>
              <p className={styles.introText}>
                Selecione abaixo o manual correspondente para tirar as suas dúvidas sobre o funcionamento do e-commerce Uemura Flores e Plantas.
              </p>

              {/* Abas */}
              <div className={styles.tabsContainer}>
                <button
                  onClick={() => {
                    setActiveTab('cliente');
                    setOpenIndex(null);
                  }}
                  className={`${styles.tabBtn} ${activeTab === 'cliente' ? styles.activeTab : ''}`}
                >
                  <BookOpen size={16} />
                  <span>Para Você (Cliente)</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('vendedor');
                    setOpenIndex(null);
                  }}
                  className={`${styles.tabBtn} ${activeTab === 'vendedor' ? styles.activeTab : ''}`}
                >
                  <BookOpen size={16} />
                  <span>Para a Loja (Vendedor)</span>
                </button>
              </div>

              {/* Accordion das FAQs */}
              <div className={styles.faqList}>
                {currentFaqs.map((faq, index) => {
                  const isItemOpen = openIndex === index;
                  return (
                    <div key={index} className={`${styles.faqItem} ${isItemOpen ? styles.faqItemOpen : ''}`}>
                      <button
                        onClick={() => toggleAccordion(index)}
                        className={styles.questionBtn}
                        aria-expanded={isItemOpen}
                      >
                        <span>{faq.pergunta}</span>
                        {isItemOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <AnimatePresence initial={false}>
                        {isItemOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={styles.answerWrapper}
                          >
                            <p className={styles.answerText}>{faq.resposta}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
