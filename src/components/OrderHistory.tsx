import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, DollarSign, ChevronDown, ChevronUp, Star, HeartHandshake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderStatusTracker } from './OrderStatusTracker';
import { API_URL, parseJson } from '../config';
import { useToast } from '../context/ToastContext';
import styles from './OrderHistory.module.css';

interface OrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProdutoDetalhe {
  id: string;
  nome: string;
  imagem: string;
  tamanhoVaso: string;
  rega: string;
  iluminacao: string;
  adubacao: string;
}

interface ItemPedido {
  id: string;
  quantidade: number;
  precoUnitario: number;
  produto: ProdutoDetalhe;
}

interface Pedido {
  id: string;
  clienteNome: string;
  // Endereco e telefone nao vem na busca por telefone (mitigacao LGPD no backend).
  // So chegam na consulta por id de um pedido especifico.
  clienteTelefone?: string;
  clienteEndereco?: string;
  total: number;
  status: string;
  dataCriacao: string;
  itens: ItemPedido[];
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [isBuscandoTelefone, setIsBuscandoTelefone] = useState(false);

  // Login por codigo: 'telefone' (pede o codigo) -> 'codigo' (digita) -> autenticado
  const [authFase, setAuthFase] = useState<'telefone' | 'codigo'>('telefone');
  const [codigoInput, setCodigoInput] = useState('');
  const [codigoDemo, setCodigoDemo] = useState('');
  const [expandedPedidoId, setExpandedPedidoId] = useState<string | null>(null);
  const [cultivoExpandido, setCultivoExpandido] = useState<{ [key: string]: boolean }>({});
  const [isCarregandoIniciais, setIsCarregandoIniciais] = useState(false);

  // Estados de Avaliacao
  const [avaliandoItem, setAvaliandoItem] = useState<{ pedidoId: string; produtoId: string } | null>(null);
  const [notaAvaliacao, setNotaAvaliacao] = useState(5);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
  const [isEnviandoAvaliacao, setIsEnviandoAvaliacao] = useState(false);
  const [itensAvaliados, setItensAvaliados] = useState<{ [key: string]: boolean }>({});

  // Carrega os pedidos salvos no localStorage do navegador
  const carregarPedidosLocais = async () => {
    const idsSalvosRaw = localStorage.getItem('uemura_historico_pedidos');
    if (!idsSalvosRaw) return;

    try {
      const ids: string[] = JSON.parse(idsSalvosRaw);
      if (ids.length === 0) return;

      setIsCarregandoIniciais(true);
      const listaPedidos: Pedido[] = [];

      for (const id of ids) {
        try {
          const response = await fetch(`${API_URL}/api/pedidos/${id}`);
          if (response.ok) {
            const ped = await parseJson(response);
            if (ped.id) listaPedidos.push(ped);
          }
        } catch (e) {
          console.warn(`Erro ao carregar pedido ${id} do servidor:`, e);
        }
      }

      setPedidos(listaPedidos);
    } catch (err) {
      console.error('Erro ao ler ids salvos:', err);
    } finally {
      setIsCarregandoIniciais(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarPedidosLocais();
      // Lê as avaliações já enviadas nesta sessão para desabilitar re-envio
      const avaliadasRaw = localStorage.getItem('uemura_itens_avaliados');
      if (avaliadasRaw) {
        setItensAvaliados(JSON.parse(avaliadasRaw));
      }
    }
  }, [isOpen]);

  // Etapa 1: pede um codigo de acesso para o telefone informado
  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone || searchPhone.length < 10) {
      showToast('Informe DDD + número (ex: 11988887777).', 'info', 'Telefone inválido');
      return;
    }

    setIsBuscandoTelefone(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/solicitar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: searchPhone })
      });
      if (!response.ok) throw new Error();

      const dados = await parseJson(response);
      setAuthFase('codigo');
      // Em modo demo o backend devolve o codigo; em producao ele iria por WhatsApp.
      if (dados.codigoDemo) {
        setCodigoDemo(dados.codigoDemo);
        showToast(`Código de acesso (demo): ${dados.codigoDemo}`, 'info', 'Use este código');
      } else {
        showToast('Enviamos um código para o seu WhatsApp.', 'info', 'Verifique seu celular');
      }
    } catch (err) {
      console.error(err);
      showToast('Sem conexão com o servidor.', 'info', 'Erro de Conexão');
    } finally {
      setIsBuscandoTelefone(false);
    }
  };

  // Etapa 2: verifica o codigo, obtem o token e ja busca o historico
  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoInput) return;

    setIsBuscandoTelefone(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verificar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: searchPhone, codigo: codigoInput })
      });

      if (!response.ok) {
        showToast('Código inválido ou expirado.', 'info', 'Tente novamente');
        return;
      }

      const { token } = await parseJson(response);
      if (!token) {
        showToast('Não foi possível validar o código. Tente novamente.', 'info', 'Erro');
        return;
      }
      await buscarHistorico(token);
    } catch (err) {
      console.error(err);
      showToast('Sem conexão com o servidor.', 'info', 'Erro de Conexão');
    } finally {
      setIsBuscandoTelefone(false);
    }
  };

  // Busca o historico usando o token de sessao autenticado
  const buscarHistorico = async (token: string) => {
    const response = await fetch(`${API_URL}/api/pedidos/cliente/${searchPhone}`, {
      headers: { 'x-session-token': token }
    });
    if (!response.ok) {
      showToast('Sessão expirada. Solicite um novo código.', 'info', 'Acesso expirado');
      setAuthFase('telefone');
      return;
    }

    const dados = await parseJson<Pedido[]>(response, []);
    setPedidos(dados);

    if (dados.length === 0) {
      showToast('Nenhum pedido encontrado para este telefone.', 'info', 'Busca de Pedidos');
    } else {
      const novosIds = dados.map((p) => p.id);
      localStorage.setItem('uemura_historico_pedidos', JSON.stringify(novosIds));
    }
  };

  const togglePedidoExpandido = (id: string) => {
    setExpandedPedidoId(expandedPedidoId === id ? null : id);
  };

  const toggleCultivo = (itemId: string) => {
    setCultivoExpandido((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Envia a avaliação da planta para o SQLite
  const handleEnviarAvaliacao = async (e: React.FormEvent, clienteNome: string) => {
    e.preventDefault();
    if (!avaliandoItem || !comentarioAvaliacao) return;

    setIsEnviandoAvaliacao(true);
    const keyAvaliada = `${avaliandoItem.pedidoId}-${avaliandoItem.produtoId}`;

    try {
      const response = await fetch(`${API_URL}/api/avaliacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNome: clienteNome || 'Cliente Uemura',
          nota: notaAvaliacao,
          comentario: comentarioAvaliacao,
          produtoId: avaliandoItem.produtoId,
          pedidoId: avaliandoItem.pedidoId
        })
      });

      if (!response.ok) throw new Error();

      // Salva no estado e no localstorage que este item já foi avaliado
      const novasAvaliadas = { ...itensAvaliados, [keyAvaliada]: true };
      setItensAvaliados(novasAvaliadas);
      localStorage.setItem('uemura_itens_avaliados', JSON.stringify(novasAvaliadas));
      
      showToast('Sua avaliação foi registrada e aparecerá na página principal.', 'sucesso', 'Obrigado! 🌟');
      setAvaliandoItem(null);
      setComentarioAvaliacao('');
    } catch (err) {
      console.error(err);
      showToast('Não foi possível enviar sua avaliação. Tente novamente.', 'info', 'Erro');
    } finally {
      setIsEnviandoAvaliacao(false);
    }
  };

  // Avanca o status de entrega no backend. Rota administrativa: exige o token de admin,
  // senao qualquer visitante marcaria o proprio pedido como pago.
  const handleSimularStatus = async (pedidoId: string, novoStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/api/pedidos/${pedidoId}/atualizar-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN ?? ''
        },
        body: JSON.stringify({ status: novoStatus })
      });

      if (response.ok) {
        // Atualiza a lista de pedidos localmente na tela do cliente
        setPedidos((prev) =>
          prev.map((p) => (p.id === pedidoId ? { ...p, status: novoStatus } : p))
        );
        return;
      }

      const erro = await parseJson(response);
      console.warn('Falha ao atualizar status:', erro.error ?? response.status);
    } catch (err) {
      console.warn('Erro ao atualizar status:', err);
    }
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

          {/* Painel lateral deslizante da esquerda */}
          <motion.div
            className={styles.historyPanel}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.35 }}
          >
            {/* Cabecalho */}
            <div className={styles.header}>
              <h2>Área do Cliente</h2>
              <button onClick={onClose} className={styles.closeBtn} aria-label="Fechar painel">
                <X size={24} />
              </button>
            </div>

            {/* Conteudo */}
            <div className={styles.content}>
              {/* Login por codigo: etapa 1 pede o telefone, etapa 2 pede o codigo */}
              {authFase === 'telefone' ? (
                <form onSubmit={handleSolicitarCodigo} className={styles.searchForm}>
                  <label htmlFor="search-phone-input">Acessar minhas compras</label>
                  <div className={styles.searchInputGroup}>
                    <input
                      id="search-phone-input"
                      type="tel"
                      placeholder="DDD + número (ex: 11988887777)"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, ''))}
                    />
                    <button type="submit" disabled={isBuscandoTelefone}>
                      {isBuscandoTelefone ? '...' : <Search size={16} />}
                    </button>
                  </div>
                  <small>Enviaremos um código de acesso para o seu telefone.</small>
                </form>
              ) : (
                <form onSubmit={handleVerificarCodigo} className={styles.searchForm}>
                  <label htmlFor="code-input">Digite o código enviado</label>
                  <div className={styles.searchInputGroup}>
                    <input
                      id="code-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder={codigoDemo ? `Código: ${codigoDemo}` : '6 dígitos'}
                      value={codigoInput}
                      onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, ''))}
                    />
                    <button type="submit" disabled={isBuscandoTelefone}>
                      {isBuscandoTelefone ? '...' : <Search size={16} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => { setAuthFase('telefone'); setCodigoInput(''); setCodigoDemo(''); }}
                  >
                    Usar outro telefone
                  </button>
                </form>
              )}

              {isCarregandoIniciais ? (
                <div className={styles.loadingState}>Buscando pedidos...</div>
              ) : pedidos.length > 0 ? (
                <div className={styles.ordersList}>
                  <h3>Meus Pedidos ({pedidos.length})</h3>

                  {pedidos.map((pedido) => {
                    const isExpanded = expandedPedidoId === pedido.id;
                    const formattedDate = new Date(pedido.dataCriacao).toLocaleDateString('pt-BR');

                    return (
                      <div key={pedido.id} className={`${styles.orderCard} ${isExpanded ? styles.expanded : ''}`}>
                        {/* Cabecalho Simples do Card */}
                        <div onClick={() => togglePedidoExpandido(pedido.id)} className={styles.orderCardHeader}>
                          <div className={styles.cardInfoCol}>
                            <span className={styles.orderCode}>{pedido.id}</span>
                            <div className={styles.cardSubmeta}>
                              <span className={styles.metaItem}>
                                <Calendar size={12} /> {formattedDate}
                              </span>
                              <span className={styles.metaItem}>
                                <DollarSign size={12} /> R$ {pedido.total.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </div>

                          <div className={styles.cardStatusCol}>
                            <span className={`${styles.statusBadge} ${styles[pedido.status.toLowerCase().replace(' ', '')]}`}>
                              {pedido.status === 'Pendente' ? 'Aguardando PIX' : pedido.status}
                            </span>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>

                        {/* Conteudo Expandido (Acompanhamento e Itens) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              className={styles.orderCardBody}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              {/* Linha de Rastreamento do Pedido */}
                              <div className={styles.trackerWrapper}>
                                <h4>Acompanhamento da Entrega</h4>
                                <OrderStatusTracker status={pedido.status} />
                              </div>

                              {/* Itens do Pedido */}
                              <div className={styles.itemsWrapper}>
                                <h4>Itens Comprados</h4>
                                <div className={styles.itemsList}>
                                  {pedido.itens.map((item) => {
                                    const keyItem = `${pedido.id}-${item.produto.id}`;
                                    const isCultivoOpen = cultivoExpandido[keyItem] || false;
                                    const jaAvaliado = itensAvaliados[keyItem] || false;

                                    return (
                                      <div key={item.id} className={styles.productItemRow}>
                                        <div className={styles.productMainRow}>
                                          <img
                                            src={item.produto.imagem}
                                            alt={item.produto.nome}
                                            className={styles.productImg}
                                          />
                                          <div className={styles.productText}>
                                            <h5>{item.produto.nome}</h5>
                                            <span>
                                              {item.quantidade}x · R$ {item.precoUnitario.toFixed(2).replace('.', ',')}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Botoes de Acao por Planta */}
                                        <div className={styles.itemActions}>
                                          {item.produto.rega && (
                                            <button
                                              onClick={() => toggleCultivo(keyItem)}
                                              className={styles.cultivoBtn}
                                            >
                                              {isCultivoOpen ? 'Esconder Guia' : 'Guia de Cultivo'}
                                            </button>
                                          )}

                                          {pedido.status === 'Entregue' && (
                                            <button
                                              disabled={jaAvaliado}
                                              onClick={() =>
                                                setAvaliandoItem(
                                                  avaliandoItem?.produtoId === item.produto.id && avaliandoItem?.pedidoId === pedido.id
                                                    ? null
                                                    : { pedidoId: pedido.id, produtoId: item.produto.id }
                                                )
                                              }
                                              className={styles.avaliarBtn}
                                            >
                                              {jaAvaliado ? 'Avaliado ✓' : 'Avaliar Planta'}
                                            </button>
                                          )}
                                        </div>

                                        {/* Guia de Cultivo Expandido */}
                                        <AnimatePresence>
                                          {isCultivoOpen && (
                                            <motion.div
                                              className={styles.cultivoBox}
                                              initial={{ opacity: 0, y: -10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              exit={{ opacity: 0, y: -10 }}
                                            >
                                              <p><strong>💧 Como Regar:</strong> {item.produto.rega}</p>
                                              <p><strong>☀️ Iluminação:</strong> {item.produto.iluminacao}</p>
                                              <p><strong>🌱 Adubação:</strong> {item.produto.adubacao}</p>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>

                                        {/* Form de Envio de Avaliacao */}
                                        <AnimatePresence>
                                          {avaliandoItem?.pedidoId === pedido.id && avaliandoItem?.produtoId === item.produto.id && (
                                            <motion.form
                                              onSubmit={(e) => handleEnviarAvaliacao(e, pedido.clienteNome)}
                                              className={styles.reviewForm}
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: 'auto' }}
                                              exit={{ opacity: 0, height: 0 }}
                                            >
                                              <h5>Avaliar {item.produto.nome}</h5>
                                              <div className={styles.starsSelect}>
                                                <span>Sua nota:</span>
                                                <div className={styles.starsRow}>
                                                  {[1, 2, 3, 4, 5].map((n) => (
                                                    <button
                                                      key={n}
                                                      type="button"
                                                      onClick={() => setNotaAvaliacao(n)}
                                                      className={styles.starSelectBtn}
                                                    >
                                                      <Star
                                                        size={20}
                                                        fill={n <= notaAvaliacao ? '#f59e0b' : 'none'}
                                                        color={n <= notaAvaliacao ? '#f59e0b' : '#94a3b8'}
                                                      />
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                              <textarea
                                                required
                                                placeholder="Escreva seu depoimento sobre esta planta (ele aparecerá dinamicamente na página principal do site)..."
                                                value={comentarioAvaliacao}
                                                onChange={(e) => setComentarioAvaliacao(e.target.value)}
                                              />
                                              <div className={styles.reviewActions}>
                                                <button
                                                  type="button"
                                                  onClick={() => setAvaliandoItem(null)}
                                                  className={styles.reviewCancelBtn}
                                                >
                                                  Cancelar
                                                </button>
                                                <button
                                                  type="submit"
                                                  disabled={isEnviandoAvaliacao}
                                                  className={styles.reviewSubmitBtn}
                                                >
                                                  {isEnviandoAvaliacao ? 'Enviando...' : 'Enviar Depoimento'}
                                                </button>
                                              </div>
                                            </motion.form>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Painel Secreto de Controle de Testes */}
                              <div className={styles.simuladorControles}>
                                <h5>Controle de Testes (Avançar Entrega)</h5>
                                <p>Simule a rota logística de transporte no banco SQLite:</p>
                                <div className={styles.simuladorBotoes}>
                                  <button
                                    onClick={() => handleSimularStatus(pedido.id, 'Aprovado')}
                                    disabled={pedido.status === 'Aprovado'}
                                    className={`${styles.simBtn} ${pedido.status === 'Aprovado' ? styles.simActive : ''}`}
                                  >
                                    Confirmar Pago
                                  </button>
                                  <button
                                    onClick={() => handleSimularStatus(pedido.id, 'Preparando')}
                                    disabled={pedido.status === 'Preparando'}
                                    className={`${styles.simBtn} ${pedido.status === 'Preparando' ? styles.simActive : ''}`}
                                  >
                                    Preparar Planta
                                  </button>
                                  <button
                                    onClick={() => handleSimularStatus(pedido.id, 'Em Rota')}
                                    disabled={pedido.status === 'Em Rota'}
                                    className={`${styles.simBtn} ${pedido.status === 'Em Rota' ? styles.simActive : ''}`}
                                  >
                                    Saiu para Rota
                                  </button>
                                  <button
                                    onClick={() => handleSimularStatus(pedido.id, 'Entregue')}
                                    disabled={pedido.status === 'Entregue'}
                                    className={`${styles.simBtn} ${pedido.status === 'Entregue' ? styles.simActive : ''}`}
                                  >
                                    Entregue ✓
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><HeartHandshake size={48} /></div>
                  <h3>Nenhum pedido no histórico</h3>
                  <p>Digite seu telefone acima ou finalize um pedido na sacola para iniciar o rastreamento em tempo real.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
