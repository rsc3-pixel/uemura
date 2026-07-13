import { MercadoPagoConfig, Payment } from 'mercadopago';

// O token vem exclusivamente do ambiente (.env). Nunca embutir credencial no codigo:
// o repositorio e publico e chaves de producao vazadas sao exploradas em minutos.
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

if (!MP_ACCESS_TOKEN) {
  console.warn(
    '[Mercado Pago] MP_ACCESS_TOKEN nao definido. ' +
    'Copie backend/.env.example para backend/.env e preencha o token. ' +
    'Sem ele o PIX real nao e gerado e o servidor usa a contingencia local.'
  );
}

// Cliente ausente quando nao ha token: as rotas caem na contingencia local.
export const mpPayment = MP_ACCESS_TOKEN
  ? new Payment(new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN }))
  : null;
