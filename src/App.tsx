import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { Wishlist } from './components/Wishlist';
import { Footer } from './components/Footer';
import { OrderHistory } from './components/OrderHistory';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { Toast, type ToastMessage } from './components/Toast';
import { PRODUTOS } from './data/produtos';
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
  
  // Estados para Notificacoes Toast
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastStatuses, setLastStatuses] = useState<{ [id: string]: string }>({});

  // Carrega os produtos do backend com fallback seguro para os dados locais
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/produtos');
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
          const response = await fetch(`http://localhost:3001/api/pedidos/${id}`);
          if (response.ok) {
            const pedido = await response.json();
            const statusAtual = pedido.status;
            const statusSalvo = lastStatuses[id];

            // Se o status acabou de mudar no SQLite, dispara a notificacao Toast
            if (statusSalvo && statusSalvo !== statusAtual) {
              adicionarToast(id, statusAtual);
            }

            // Atualiza o cache do status
            setLastStatuses(prev => ({
              ...prev,
              [id]: statusAtual
            }));
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
  }, [lastStatuses]);

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

    const novoToast: ToastMessage = {
      id: `${pedidoId}-${Date.now()}`,
      texto: `${titulo} - ${mensagem}`,
      tipo: status === 'Aprovado' ? 'sucesso' : 'info'
    };

    setToasts(prev => [...prev, novoToast]);
  };

  const removerToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
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
      <Toast toasts={toasts} onRemove={removerToast} />

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
