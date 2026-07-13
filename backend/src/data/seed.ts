import { prisma } from '../server.js';

export const popularBancoSeVazio = async () => {
  try {
    console.log('Iniciando atualização e seeding do banco SQLite...');

    // 1. Cadastrar/Atualizar os produtos com dados de cultivo
    const plantasIniciais = [
      {
        id: '1',
        nome: 'Tomate cereja orgânico',
        preco: 34.00,
        valorAnterior: 36.00,
        desconto: 6,
        imagem: 'https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/produtos/c7e28c7e-c5a3-4d30-96e3-aa0aa45fce43.png',
        categoria: 'Flores e Plantas',
        tamanhoVaso: 'pote 14 cm',
        descricao: 'Ideal para cultivo em pequenos quintais, varandas e apartamentos com boa iluminação solar direta.',
        rega: 'Raramente deixar secar. Regar de 3 a 4 vezes por semana mantendo a terra úmida mas não encharcada.',
        iluminacao: 'Sol pleno. Necessita de pelo menos 4 a 6 horas diárias de sol direto para frutificar.',
        adubacao: 'Quinzenal com adubo orgânico rico em fósforo e potássio durante a floração.'
      },
      {
        id: '2',
        nome: 'Pata de Elefante ornamental',
        preco: 18.00,
        valorAnterior: 24.00,
        desconto: 25,
        imagem: 'https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/produtos/b5313b19-e43a-4a38-9eba-d2d3bbd838e8.png',
        categoria: 'Flores e Plantas',
        tamanhoVaso: 'pote 17 cm',
        descricao: 'Planta de baixíssima manutenção que armazena água no tronco, ideal para decoração interna.',
        rega: 'Espaçada. Regar apenas quando a terra secar totalmente (a cada 15 a 20 dias no inverno, semanal no verão).',
        iluminacao: 'Luz difusa forte ou sol direto. Adapta-se muito bem a escritórios e salas iluminadas.',
        adubacao: 'Semestral. Utilizar adubo de liberação lenta no início da primavera.'
      },
      {
        id: '3',
        nome: 'Jibóia Pendente Longa',
        preco: 140.00,
        imagem: 'https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/produtos/a555918d-da66-4e5b-b4d6-5f5d931a83b7.png',
        categoria: 'Flores e Plantas',
        tamanhoVaso: 'cuia 21 cm',
        descricao: 'Folhagem verde exuberante que cresce em cascata, excelente para pendurar em estantes ou suportes.',
        rega: 'Moderada. Regar de 1 a 2 vezes por semana, esperando os primeiros centímetros de terra secarem.',
        iluminacao: 'Meia sombra ou luz filtrada. Evitar sol direto nas folhas para não queimá-las.',
        adubacao: 'Mensal na primavera e verão com adubo foliar rico em nitrogênio para folhagem.'
      },
      {
        id: '4',
        nome: 'Samambaia Blechnum Silver Lady',
        preco: 32.00,
        imagem: 'https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/produtos/04bd1595-bace-4c4b-b20c-c17aa16af178.png',
        categoria: 'Flores e Plantas',
        tamanhoVaso: 'pote 17 cm',
        descricao: 'Uma variação elegante de samambaia com folhas mais estruturadas que lembram uma pequena palmeira.',
        rega: 'Frequente. Regar 3 vezes por semana e borrifar água nas folhas nos dias quentes para manter a umidade.',
        iluminacao: 'Sombra com boa luminosidade. Protegida de correntes de vento seco.',
        adubacao: 'Mensal com adubo específico para samambaias diluído na água de rega.'
      },
      {
        id: '5',
        nome: 'Ficus Elástica Shivereana Moonshine',
        preco: 65.00,
        imagem: 'https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/produtos/31cfb0a7-318f-478d-92a2-fd496e0f5116.png',
        categoria: 'Flores e Plantas',
        tamanhoVaso: 'pote 17 cm',
        descricao: 'Raridade com folhas variegadas em tons pastéis de verde e creme, uma verdadeira escultura viva.',
        rega: 'Moderada. Deixar secar a metade superior do vaso antes de regar novamente (cerca de 1 vez por semana).',
        iluminacao: 'Luz brilhante indireta. Luz insuficiente pode fazer a planta perder a coloração creme característica.',
        adubacao: 'Bimestral com fertilizante balanceado NPK 10-10-10 nas estações quentes.'
      },
      {
        id: '6',
        nome: 'Begônia Mari Premium',
        preco: 105.00,
        imagem: 'https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/produtos/e9738694-560d-4174-8008-ee7204034b5f.png',
        categoria: 'Flores e Plantas',
        tamanhoVaso: 'pote 20 cm',
        descricao: 'Folhas texturizadas marcantes com coloração única, perfeita para dar destaque em ambientes sombreados.',
        rega: 'Evitar encharcamento. Regar de 1 a 2 vezes por semana despejando a água direto na terra, evitando molhar as folhas.',
        iluminacao: 'Luz filtrada e suave. Não tolera sol direto e prefere calor moderado.',
        adubacao: 'Mensal. Fertilizante líquido suave específico para flores e begônias.'
      },
      {
        id: '7',
        nome: 'Calathea Orbifolia Rara',
        preco: 146.00,
        imagem: 'https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/produtos/607d60f3-c75d-4b25-b267-7017f6b3656d.png',
        categoria: 'Flores e Plantas',
        tamanhoVaso: 'pote 23 cm',
        descricao: 'Folhas redondas e largas com listras prateadas que parecem pintadas à mão.',
        rega: 'Umidade constante. Regar de 2 a 3 vezes por semana utilizando água filtrada ou descansada se possível.',
        iluminacao: 'Sombra com luz indireta média. Luz solar forte queima as folhas e apaga os desenhos prateados.',
        adubacao: 'Bimestral com adubo orgânico bem diluído na água de rega.'
      },
      {
        id: '8',
        nome: 'Begônia Maculata',
        preco: 105.00,
        imagem: 'https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/produtos/1ff37434-3948-4653-b337-a43554f80388.png',
        categoria: 'Flores e Plantas',
        tamanhoVaso: 'pote 20 cm',
        descricao: 'Famosa pelas folhas verdes com bolinhas brancas na frente e verso avermelhado.',
        rega: 'Rega direcionada à raiz de 2 vezes por semana. Manter solo levemente úmido, mas nunca encharcado.',
        iluminacao: 'Luz abundante indireta. Prefere janelas voltadas para o leste que recebem sol suave da manhã.',
        adubacao: 'Mensal durante a primavera e o verão com NPK líquido diluído.'
      },
      {
        id: '9',
        nome: 'Tostão Rosa Delicado',
        preco: 9.50,
        imagem: 'https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/produtos/a8bd6e3b-2a29-48eb-ac8a-020e056b1d72.png',
        categoria: 'Flores e Plantas',
        tamanhoVaso: 'pote 11 cm',
        descricao: 'Pequena suculenta pendente com minúsculas folhas variegadas em verde, branco e rosa.',
        rega: 'Baixa. Regar apenas quando o vaso estiver leve e o solo totalmente seco (semanal ou quinzenal).',
        iluminacao: 'Muita luz indireta ou sol da manhã. Precisa de boa luminosidade para manter o tom rosado.',
        adubacao: 'Trimestral com adubo diluído próprio para suculentas e cactos.'
      },
      {
        id: '10',
        nome: 'Vaso Vietnamita Canelado Terracota',
        preco: 320.00,
        imagem: 'https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/produtos/4cd85e2f-e847-41cb-8625-94f38969c924.png',
        categoria: 'Vasos',
        tamanhoVaso: 'Grande',
        descricao: 'Vaso importado com acabamento vitrificado rústico e alta durabilidade para ambientes externos.',
        rega: 'Não se aplica.',
        iluminacao: 'Resistente a sol pleno, chuva, ventos e geadas externas.',
        adubacao: 'Não se aplica.'
      },
      {
        id: '11',
        nome: 'Adubo Fertilizante Orgânico Premium',
        preco: 24.90,
        imagem: 'https://boxloja-std-cdn-r2.minhaboxloja.com/lojas/9s0e9/produtos/ec8586e4-a6b8-4fbf-9061-924af6530fd0.jpg',
        categoria: 'Acessórios',
        tamanhoVaso: '1kg',
        descricao: 'Nutrição completa para fortalecer as folhas e estimular a floração saudável das suas plantas.',
        rega: 'Aplicar a cada 30 dias espalhando sobre a terra e regando em seguida para ativação.',
        iluminacao: 'Armazenar em local seco, fresco e longe da luz solar direta.',
        adubacao: 'Dosagem recomendada: 1 colher de sopa para vasos pequenos, 3 para vasos grandes.'
      }
    ];

    for (const planta of plantasIniciais) {
      await prisma.produto.upsert({
        where: { id: planta.id },
        update: {
          nome: planta.nome,
          preco: planta.preco,
          imagem: planta.imagem,
          categoria: planta.categoria,
          valorAnterior: planta.valorAnterior || null,
          desconto: planta.desconto || null,
          descricao: planta.descricao,
          tamanhoVaso: planta.tamanhoVaso,
          rega: planta.rega,
          iluminacao: planta.iluminacao,
          adubacao: planta.adubacao
        },
        create: planta
      });
    }
    console.log('Seeding dos produtos com guias de cultivo concluído!');

    // 2. Cadastrar os cupons de teste promocionais
    const cuponsIniciais = [
      { codigo: 'UEMURA10', descontoPorcentagem: 10, ativo: true },
      { codigo: 'PLANTAS15', descontoPorcentagem: 15, ativo: true },
      { codigo: 'FRETEGRATIS', descontoPorcentagem: 100, ativo: true } // Cupom de teste de 100% de desconto
    ];

    for (const cupom of cuponsIniciais) {
      await prisma.cupom.upsert({
        where: { codigo: cupom.codigo },
        update: {
          descontoPorcentagem: cupom.descontoPorcentagem,
          ativo: cupom.ativo
        },
        create: cupom
      });
    }
    console.log('Seeding de cupons promocionais concluído com sucesso!');

    // 3. Cadastrar avaliações iniciais para exibir na Home do site
    const avaliacoesIniciais = [
      {
        id: 'rev-1',
        clienteNome: 'Mariana Silva',
        nota: 5,
        comentario: 'Minha Begônia Maculata chegou perfeita! Muito bem embalada e as folhas vieram super viçosas. O guia de cultivo ajudou demais.',
        produtoId: '8'
      },
      {
        id: 'rev-2',
        clienteNome: 'Rodrigo Souza',
        nota: 5,
        comentario: 'O Ficus Moonshine é simplesmente espetacular, uma verdadeira obra de arte na minha sala. Recomendo muito a Uemura.',
        produtoId: '5'
      },
      {
        id: 'rev-3',
        clienteNome: 'Ana Claudia',
        nota: 4,
        comentario: 'Comprei o tomateiro orgânico e ele já está cheio de florzinhas amarelas. Entrega rápida de moto aqui em SP.',
        produtoId: '1'
      }
    ];

    for (const rev of avaliacoesIniciais) {
      await prisma.avaliacao.upsert({
        where: { id: rev.id },
        update: {
          clienteNome: rev.clienteNome,
          nota: rev.nota,
          comentario: rev.comentario,
          produtoId: rev.produtoId
        },
        create: rev
      });
    }
    console.log('Seeding de avaliações iniciais de teste concluído com sucesso!');

    console.log('Seeding geral do SQLite concluído com sucesso!');

  } catch (error) {
    console.error('Erro ao executar o seeding de dados:', error);
  }
};
