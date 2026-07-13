import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { Wishlist } from './components/Wishlist';
import { Footer } from './components/Footer';
import { OrderHistory } from './components/OrderHistory';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { Toast } from './components/Toast';
import { PRODUTOS } from './data/produtos';
import { API_URL } from './config';
import { useToast } from './context/ToastContext';
import type { Produto } from './types';
import './App.css';

function App() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas as Plantas');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  
  // Notificacoes Toast agora vem do contexto global (qualquer componente dispara)
  const { toasts, showToast, removeToast } = useToast();
  // Cache de status em ref: nao dispara re-render nem recria o intervalo de polling
  const lastStatusesRef = useRef<{ [id: string]: string }>({});

  // Carrega os produtos do backend com fallback seguro para os dados locais
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const response = await fetch(`${API_URL}/api/produtos`);
        if (!response.ok) {
          throw new Error('Falha ao obter dados do servidor');
        }
        const dados = await response.json();
        setProdutos(dados);
      } catch (error) {
        console.warn('Erro ao conectar ao backend (utilizando catálogo local de contingência):', error);
        setProdutos(PRODUTOS);
      }
    };
    carregarProdutos();
  }, []);

  // Polling em segundo plano para escutar mudanças de status dos pedidos no SQLite
  useEffect(() => {
    const idsHistoricoRaw = localStorage.getItem('uemura_historico_pedidos');
    if (!idsHistoricoRaw) return;

    const idsHistorico: string[] = JSON.parse(idsHistoricoRaw);
    if (idsHistorico.length === 0) return;

    const checkStatuses = async () => {
      for (const id of idsHistorico) {
        try {
          const response = await fetch(`${API_URL}/api/pedidos/${id}`);
          if (response.ok) {
            const pedido = await response.json();
            const statusAtual = pedido.status;
            const statusSalvo = lastStatusesRef.current[id];

            // Se o status acabou de mudar no SQLite, dispara a notificacao Toast
            if (statusSalvo && statusSalvo !== statusAtual) {
              adicionarToast(id, statusAtual);
            }

            // Atualiza o cache do status (ref: sem re-render)
            lastStatusesRef.current[id] = statusAtual;
          }
        } catch (err) {
          // Ignora silenciosamente falhas de rede durante o polling
        }
      }
    };

    // Roda a verificação inicial e depois define o intervalo
    checkStatuses();
    const interval = window.setInterval(checkStatuses, 4000);

    return () => clearInterval(interval);
    // Sem dependencias: o efeito monta o intervalo UMA vez. O cache de status vive
    // em ref, entao ler/escrever nele nao recria o polling a cada 4s como antes.
  }, []);

  const adicionarToast = (pedidoId: string, status: string) => {
    let titulo = 'Pedido Atualizado';
    let mensagem = `Seu pedido ${pedidoId} mudou de status.`;

    switch (status) {
      case 'Aprovado':
        titulo = 'Pagamento Aprovado! 💳';
        mensagem = `O pagamento do pedido ${pedidoId} foi compensado no SQLite.`;
        break;
      case 'Preparando':
        titulo = 'Preparando Pedido 🌸';
        mensagem = `Estamos selecionando e embalando as plantas do pedido ${pedidoId} na estufa.`;
        break;
      case 'Em Rota':
        titulo = 'Saiu para Entrega! 🛵';
        mensagem = `O motoboy da Uemura iniciou o transporte do pedido ${pedidoId}.`;
        break;
      case 'Entregue':
        titulo = 'Pedido Entregue! 🎉';
        mensagem = `O pedido ${pedidoId} foi entregue. Deixe uma avaliação!`;
        break;
    }

    showToast(mensagem, status === 'Aprovado' ? 'sucesso' : 'info', titulo);
  };

  // Filtragem dos produtos
  const produtosFiltrados = produtos.filter((prod) => {
    const matchesSearch = prod.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'Todas as Plantas' || prod.categoria === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="appContainer">
      {/* Notificacoes Flutuantes (Toast) */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Cabecalho */}
      <Header
        onSearch={setSearchTerm}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onCartOpen={() => setIsCartOpen(true)}
        onFavoritesOpen={() => setIsFavoritesOpen(true)}
        onHistoryOpen={() => setIsHistoryOpen(true)}
      />

      {/* Banner / Hero */}
      <section className="heroSection">
        <div className="heroContent container">
          <h1>Tradição e Beleza no Verde</h1>
          <p>
            Flores frescas, folhagens ornamentais e acessórios de jardinagem selecionados com o cuidado e a tradição da família Uemura.
          </p>
        </div>
      </section>

      {/* Grid de Produtos e Vitrine principal */}
      <main className="mainContent">
        <ProductGrid
          produtos={produtosFiltrados}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
      </main>

      {/* Secao de Depoimentos Reais de Clientes */}
      <Testimonials />

      {/* Painel Lateral do Carrinho */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Painel Lateral de Favoritos */}
      <Wishlist isOpen={isFavoritesOpen} onClose={() => setIsFavoritesOpen(false)} />

      {/* Painel Lateral de Historico de Pedidos / Area do Cliente */}
      <OrderHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      {/* Painel Central de Ajuda / FAQ */}
      <FAQ isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />

      {/* Rodape Institucional */}
      <Footer onFAQOpen={() => setIsFAQOpen(true)} />
    </div>
  );
}

export default App;
