import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Plus, Minus, Send, Copy, Check, Ticket, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config';
import styles from './Cart.module.css';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PedidoCriado {
  id: string;
  total: number;
  status: string;
}

interface PixDados {
  copiaCola: string;
  qrcode: string;
}

export const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { showToast } = useToast();
  const [cep, setCep] = useState('');
  const [frete, setFrete] = useState<number | null>(null);
  const [isCalculando, setIsCalculando] = useState(false);
  const [isEnviandoPedido, setIsEnviandoPedido] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState<PedidoCriado | null>(null);
  const [pix, setPix] = useState<PixDados | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [isSimulandoBanco, setIsSimulandoBanco] = useState(false);

  // Estados Logísticos (Correios e ViaCEP)
  const [opcoesFrete, setOpcoesFrete] = useState<any[]>([]);
  const [freteSelecionado, setFreteSelecionado] = useState<any | null>(null);
  const [freteErro, setFreteErro] = useState('');

  // Estados do Cupom
  const [cupomInput, setCupomInput] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState('');
  const [descontoPorcentagem, setDescontoPorcentagem] = useState(0);
  const [valorDesconto, setValorDesconto] = useState(0);
  const [cupomErro, setCupomErro] = useState('');
  const [cupomSucesso, setCupomSucesso] = useState('');
  const [isValidandoCupom, setIsValidandoCupom] = useState(false);

  // Form de Checkout
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  // Referencia para o intervalo de consulta (polling)
  const pollingIntervalRef = useRef<number | null>(null);

  // Limpa o polling ao desmontar o componente
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Recalcula o valor do desconto se o total do carrinho mudar
  useEffect(() => {
    if (descontoPorcentagem > 0) {
      setValorDesconto(Number(((cartTotal * descontoPorcentagem) / 100).toFixed(2)));
    } else {
      setValorDesconto(0);
    }
  }, [cartTotal, descontoPorcentagem]);

  // Executa o cálculo de frete dinâmico via API do backend + ViaCEP no front-end
  const handleCalcularFrete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cep || cep.length < 8) return;

    setIsCalculando(true);
    setFreteErro('');
    setOpcoesFrete([]);
    setFreteSelecionado(null);

    // 1. Tenta buscar dados de endereço na API pública ViaCEP
    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (viaCepRes.ok) {
        const addr = await viaCepRes.json();
        if (!addr.erro) {
          // Preenche o endereço automaticamente deixando espaço para digitar o número
          setCheckoutAddress(`${addr.logradouro}, Nº - ${addr.bairro}, ${addr.localidade} - ${addr.uf}`);
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar ViaCEP:', e);
    }

    // 2. Tenta calcular taxas de frete na API do backend
    try {
      const response = await fetch(`${API_URL}/api/frete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep,
          itens: cartItems
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao calcular frete no servidor.');
      }

      const dados = await response.json();
      setOpcoesFrete(dados.opcoes);
      
      // Define a primeira opção de frete por padrão
      if (dados.opcoes && dados.opcoes.length > 0) {
        setFreteSelecionado(dados.opcoes[0]);
        setFrete(dados.opcoes[0].preco);
      }
    } catch (err: any) {
      setFrete(null);
      setFreteErro(err.message || 'Sem conexão com o servidor de frete.');
    } finally {
      setIsCalculando(false);
    }
  };

  const handleAplicarCupom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cupomInput) return;

    setIsValidandoCupom(true);
    setCupomErro('');
    setCupomSucesso('');

    try {
      const response = await fetch(`${API_URL}/api/cupons/validar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: cupomInput,
          subtotal: cartTotal
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Cupom invalido');
      }

      const dados = await response.json();
      setDescontoPorcentagem(dados.descontoPorcentagem);
      setValorDesconto(dados.valorDesconto);
      setCupomAplicado(cupomInput.toUpperCase());
      setCupomSucesso(`Cupom ${cupomInput.toUpperCase()} aplicado (${dados.descontoPorcentagem}% de desconto)`);
    } catch (err: any) {
      setDescontoPorcentagem(0);
      setValorDesconto(0);
      setCupomAplicado('');
      setCupomErro(err.message || 'Cupom invalido ou expirado');
    } finally {
      setIsValidandoCupom(false);
    }
  };

  // Envia o pedido para a API do backend Node.js
  // Enviamos INTENCOES (qual cupom, qual opcao de frete), nunca valores em reais:
  // o servidor recalcula desconto e frete a partir do banco e das regras dele.
  const handleFinalizarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName || !checkoutPhone || !checkoutAddress || !freteSelecionado) return;

    setIsEnviandoPedido(true);

    try {
      const response = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNome: checkoutName,
          clienteTelefone: checkoutPhone,
          clienteEndereco: checkoutAddress,
          cep,
          freteId: freteSelecionado.id,
          cupomCodigo: cupomAplicado || undefined,
          itens: cartItems
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao registrar o pedido no servidor.');
      }

      const dados = await response.json();
      setPedidoCriado(dados.pedido);
      setPix(dados.pix);

      // Salva o ID do novo pedido no localStorage para a Area do Cliente
      const idsExistentesRaw = localStorage.getItem('uemura_historico_pedidos');
      const idsExistentes = idsExistentesRaw ? JSON.parse(idsExistentesRaw) : [];
      if (!idsExistentes.includes(dados.pedido.id)) {
        idsExistentes.push(dados.pedido.id);
        localStorage.setItem('uemura_historico_pedidos', JSON.stringify(idsExistentes));
      }

      // Inicia a escuta (polling) para verificar o status do pagamento no banco SQLite
      iniciarPollingPagamento(dados.pedido.id);

    } catch (err) {
      console.error(err);
      // Fallback estatico caso o backend nao esteja rodando
      showToast('Sem conexão com o servidor. Rodando em modo de demonstração offline.', 'info', 'Modo Offline');
      
      const offlinePedidoId = `PED-${Math.floor(100000 + Math.random() * 900000)}`;
      setPedidoCriado({
        id: offlinePedidoId,
        total: Math.max(0, cartTotal - valorDesconto) + (frete || 0),
        status: 'Pendente'
      });
      setPix({
        copiaCola: '00020101021226580014br.gov.bcb.pix0136pix-offline-demonstracao-uemura',
        qrcode: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=offline'
      });
    } finally {
      setIsEnviandoPedido(false);
    }
  };

  // Consulta o status do pedido a cada 3 segundos no banco SQLite
  const iniciarPollingPagamento = (pedidoId: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/pedidos/${pedidoId}`);
        if (response.ok) {
          const pedido = await response.json();
          if (pedido.status === 'Aprovado') {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setPedidoCriado(null);
            setPix(null);
            setIsCheckoutSuccess(true);
            
            // Sucesso e limpa o carrinho
            setTimeout(() => {
              clearCart();
              // Reseta os estados
              setDescontoPorcentagem(0);
              setValorDesconto(0);
              setCupomInput('');
              setCupomSucesso('');
              setCep('');
              setFrete(null);
              setOpcoesFrete([]);
              setFreteSelecionado(null);
              setFreteErro('');
              setIsCheckoutSuccess(false);
              setMostrarForm(false);
              onClose();
            }, 3000);
          }
        }
      } catch (err) {
        console.warn('Erro ao consultar status do pagamento:', err);
      }
    }, 3000);
  };

  // Simula o pagamento chamando a API do backend
  const handleSimularPagamentoBanco = async () => {
    if (!pedidoCriado) return;
    setIsSimulandoBanco(true);

    try {
      const response = await fetch(`${API_URL}/api/pedidos/${pedidoCriado.id}/simular-pagamento`, {
        method: 'POST',
        headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN ?? '' }
      });

      if (!response.ok) {
        throw new Error('Falha ao simular pagamento no banco.');
      }

      // Se estiver offline, aprova localmente de forma direta
    } catch (err) {
      console.warn('Backend offline, simulando aprovacao direta no front-end:', err);
      
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      setPedidoCriado(null);
      setPix(null);
      setIsCheckoutSuccess(true);
      
      setTimeout(() => {
        clearCart();
        setDescontoPorcentagem(0);
        setValorDesconto(0);
        setCupomInput('');
        setCupomSucesso('');
        setCep('');
        setFrete(null);
        setOpcoesFrete([]);
        setFreteSelecionado(null);
        setFreteErro('');
        setIsCheckoutSuccess(false);
        setMostrarForm(false);
        onClose();
      }, 3000);
    } finally {
      setIsSimulandoBanco(false);
    }
  };

  const handleCopiarPix = () => {
    if (!pix) return;
    navigator.clipboard.writeText(pix.copiaCola);
    setPixCopiado(true);
    setTimeout(() => setPixCopiado(false), 2000);
  };

  const totalComDesconto = Math.max(0, cartTotal - valorDesconto);
  const totalComFrete = totalComDesconto + (frete || 0);

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

          {/* Painel do Carrinho */}
          <motion.div
            className={styles.cartPanel}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35 }}
          >
            {/* Cabecalho */}
            <div className={styles.header}>
              <h2>Sacola de Compras</h2>
              <button onClick={onClose} className={styles.closeBtn} aria-label="Fechar carrinho">
                <X size={24} />
              </button>
            </div>

            {/* Conteudo */}
            <div className={styles.content}>
              {isCheckoutSuccess ? (
                /* Pagamento Aprovado */
                <div className={styles.successState}>
                  <div className={styles.successIcon}>🎉</div>
                  <h3>Pagamento Aprovado!</h3>
                  <p>Seu pedido foi registrado no banco de dados SQLite e o pagamento foi liquidado com sucesso. Obrigado por testar!</p>
                  <div className={styles.loader}>
                    <div className={styles.loaderBar}></div>
                  </div>
                </div>
              ) : pedidoCriado && pix ? (
                /* Tela de Pagamento por PIX */
                <div className={styles.pixContainer}>
                  <div className={styles.pixHeader}>
                    <h3>Pedido {pedidoCriado.id} Registrado</h3>
                    <p className={styles.pixAmount}>Total: R$ {pedidoCriado.total.toFixed(2).replace('.', ',')}</p>
                  </div>

                  <div className={styles.qrcodeWrapper}>
                    <p>Escaneie o QR Code abaixo para pagar:</p>
                    {pix.qrcode.startsWith('data:') ? (
                      <img src={pix.qrcode} alt="QR Code PIX Real" className={styles.qrcodeImage} />
                    ) : (
                      <img src={pix.qrcode} alt="QR Code PIX Simulado" className={styles.qrcodeImage} />
                    )}
                  </div>

                  <div className={styles.copiaColaWrapper}>
                    <p>Ou utilize o PIX Copia e Cola:</p>
                    <div className={styles.copiaColaBox}>
                      <span className={styles.pixCodeText}>{pix.copiaCola}</span>
                      <button onClick={handleCopiarPix} className={styles.copyBtn} aria-label="Copiar código PIX">
                        {pixCopiado ? <Check size={18} className={styles.successIconColor} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Simulador de Aprovacao do Banco */}
                  <div className={styles.bancoSimulador}>
                    <p className={styles.simulaDica}>Demonstração técnica: Clique abaixo para simular que o cliente efetuou o pagamento no aplicativo do banco.</p>
                    <button
                      onClick={handleSimularPagamentoBanco}
                      disabled={isSimulandoBanco}
                      className={styles.simularBtn}
                    >
                      {isSimulandoBanco ? 'Processando liquidação...' : 'Simular Pagamento no Banco'}
                    </button>
                  </div>
                </div>
              ) : cartItems.length > 0 ? (
                <>
                  {/* Lista de Itens */}
                  <div className={styles.itemsList}>
                    {cartItems.map((item) => (
                      <div key={item.produto.id} className={styles.cartItem}>
                        <img
                          src={item.produto.imagem}
                          alt={item.produto.nome}
                          className={styles.itemImage}
                        />
                        <div className={styles.itemInfo}>
                          <h4 className={styles.itemName}>{item.produto.nome}</h4>
                          <span className={styles.itemSize}>{item.produto.tamanhoVaso}</span>
                          <span className={styles.itemPrice}>
                            R$ {(item.produto.preco * item.quantidade).toFixed(2).replace('.', ',')}
                          </span>

                          <div className={styles.qtyControls}>
                            <button
                              onClick={() => updateQuantity(item.produto.id, item.quantidade - 1)}
                              className={styles.qtyBtn}
                              aria-label="Diminuir"
                            >
                              <Minus size={14} />
                            </button>
                            <span className={styles.qtyVal}>{item.quantidade}</span>
                            <button
                              onClick={() => updateQuantity(item.produto.id, item.quantidade + 1)}
                              className={styles.qtyBtn}
                              aria-label="Aumentar"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.produto.id)}
                          className={styles.deleteBtn}
                          aria-label="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Resumo financeiro */}
                  <div className={styles.summary}>
                    {/* Form de Simular Frete Misto */}
                    <form onSubmit={handleCalcularFrete} className={styles.freightForm}>
                      <label htmlFor="cep-input">Simular Frete (Correios/Local)</label>
                      <div className={styles.freightInputGroup}>
                        <input
                          id="cep-input"
                          type="text"
                          maxLength={8}
                          placeholder="Digite seu CEP"
                          value={cep}
                          onChange={(e) => setCep(e.target.value.replace(/\D/g, ''))}
                        />
                        <button type="submit" disabled={isCalculando}>
                          {isCalculando ? '...' : <Truck size={16} />}
                        </button>
                      </div>

                      {/* Exibicao de Opcoes de Frete */}
                      {opcoesFrete.length > 0 && (
                        <div className={styles.opcoesFreteWrapper}>
                          {opcoesFrete.map((opcao) => (
                            <label
                              key={opcao.id}
                              className={`${styles.opcaoFreteLabel} ${
                                freteSelecionado?.id === opcao.id ? styles.opcaoSelecionada : ''
                              }`}
                            >
                              <input
                                type="radio"
                                name="opcao_frete"
                                checked={freteSelecionado?.id === opcao.id}
                                onChange={() => {
                                  setFreteSelecionado(opcao);
                                  setFrete(opcao.preco);
                                }}
                              />
                              <div className={styles.opcaoFreteMeta}>
                                <span className={styles.opcaoFreteNome}>
                                  {opcao.nome} - <strong>R$ {opcao.preco.toFixed(2).replace('.', ',')}</strong>
                                </span>
                                <span className={styles.opcaoFretePrazo}>Prazo: {opcao.prazo}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {freteErro && <p className={styles.freightError}>{freteErro}</p>}
                    </form>

                    {/* Form de Cupom de Desconto */}
                    <form onSubmit={handleAplicarCupom} className={styles.freightForm}>
                      <label htmlFor="coupon-input">Cupom de Desconto</label>
                      <div className={styles.freightInputGroup}>
                        <input
                          id="coupon-input"
                          type="text"
                          placeholder="Ex: UEMURA10"
                          value={cupomInput}
                          onChange={(e) => setCupomInput(e.target.value)}
                        />
                        <button type="submit" disabled={isValidandoCupom}>
                          {isValidandoCupom ? '...' : <Ticket size={14} />}
                        </button>
                      </div>
                      {cupomErro && <p className={styles.couponError}>{cupomErro}</p>}
                      {cupomSucesso && <p className={styles.couponSuccess}>{cupomSucesso}</p>}
                    </form>

                    <div className={styles.totalRow}>
                      <span>Subtotal</span>
                      <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                    </div>

                    {valorDesconto > 0 && (
                      <div className={`${styles.totalRow} ${styles.discountRow}`}>
                        <span>Desconto ({descontoPorcentagem}%)</span>
                        <span>- R$ {valorDesconto.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}

                    {frete !== null && (
                      <div className={styles.totalRow}>
                        <span>Frete ({freteSelecionado?.nome})</span>
                        <span>R$ {frete.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    
                    <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                      <span>Total Geral</span>
                      <span>R$ {totalComFrete.toFixed(2).replace('.', ',')}</span>
                    </div>

                    {freteErro ? (
                      <div className={styles.blockCheckoutMsg}>
                        Resolva o problema no cálculo de frete acima para liberar a finalização do pedido.
                      </div>
                    ) : (
                      !mostrarForm ? (
                        <button
                          onClick={() => setMostrarForm(true)}
                          className={styles.checkoutBtn}
                        >
                          Finalizar Compra
                        </button>
                      ) : (
                        <form onSubmit={handleFinalizarCompra} className={styles.checkoutForm}>
                          <h4>Dados de Entrega (SQLite backend)</h4>
                          <div className={styles.formGroup}>
                            <input
                              type="text"
                              required
                              placeholder="Nome completo"
                              value={checkoutName}
                              onChange={(e) => setCheckoutName(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <input
                              type="tel"
                              required
                              placeholder="Telefone / WhatsApp"
                              value={checkoutPhone}
                              onChange={(e) => setCheckoutPhone(e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <textarea
                              required
                              placeholder="Endereço de entrega completo"
                              value={checkoutAddress}
                              onChange={(e) => setCheckoutAddress(e.target.value)}
                            />
                          </div>
                          <div className={styles.formActions}>
                            <button
                              type="button"
                              onClick={() => setMostrarForm(false)}
                              className={styles.cancelBtn}
                            >
                              Voltar
                            </button>
                            <button type="submit" className={styles.confirmBtn} disabled={isEnviandoPedido}>
                              <Send size={16} />
                              <span>{isEnviandoPedido ? 'Enviando...' : 'Confirmar Pedido'}</span>
                            </button>
                          </div>
                        </form>
                      )
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🛍️</div>
                  <h3>Sua sacola está vazia</h3>
                  <p>Navegue pelo nosso catálogo de flores e plantas e adicione verde ao seu lar!</p>
                  <button onClick={onClose} className={styles.continueBtn}>
                    Continuar comprando
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
