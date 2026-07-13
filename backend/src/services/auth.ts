import { randomInt, randomUUID } from 'crypto';

// Autenticacao passwordless por codigo, associada ao telefone.
//
// Estado em memoria (Map): suficiente para uma unica instancia de servidor, que e o
// caso deste projeto. Em producao com varias instancias, isto iria para um store
// compartilhado (Redis), senao um codigo gerado numa instancia nao seria encontrado
// em outra. Ver docs/rulebook_uemura.md.

interface CodigoPendente {
  codigo: string;
  expiraEm: number;
}

interface Sessao {
  telefone: string;
  expiraEm: number;
}

const CODIGO_TTL_MS = 5 * 60 * 1000;        // 5 minutos para digitar o codigo
const SESSAO_TTL_MS = 30 * 60 * 1000;       // 30 minutos de sessao apos autenticar

const codigosPorTelefone = new Map<string, CodigoPendente>();
const sessoesPorToken = new Map<string, Sessao>();

const soDigitos = (valor: string) => String(valor).replace(/\D/g, '');

// Gera e guarda um codigo de 6 digitos para o telefone. Retorna o codigo para que,
// em modo demo, a rota o exiba. Em producao, o codigo seria enviado por WhatsApp e
// NUNCA retornado na resposta.
export const gerarCodigo = (telefoneBruto: string, agora: number): string => {
  const telefone = soDigitos(telefoneBruto);
  const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
  codigosPorTelefone.set(telefone, { codigo, expiraEm: agora + CODIGO_TTL_MS });
  return codigo;
};

// Confere o codigo. Se bater e estiver no prazo, consome o codigo e cria uma sessao,
// devolvendo o token. Retorna null se invalido ou expirado.
export const verificarCodigo = (telefoneBruto: string, codigoInformado: string, agora: number): string | null => {
  const telefone = soDigitos(telefoneBruto);
  const pendente = codigosPorTelefone.get(telefone);

  if (!pendente || pendente.expiraEm < agora || pendente.codigo !== String(codigoInformado)) {
    return null;
  }

  codigosPorTelefone.delete(telefone); // codigo e de uso unico
  const token = randomUUID();
  sessoesPorToken.set(token, { telefone, expiraEm: agora + SESSAO_TTL_MS });
  return token;
};

// Valida se o token pertence a uma sessao viva do telefone informado.
export const sessaoValida = (token: string | undefined, telefoneBruto: string, agora: number): boolean => {
  if (!token) return false;
  const sessao = sessoesPorToken.get(token);
  if (!sessao || sessao.expiraEm < agora) return false;
  return sessao.telefone === soDigitos(telefoneBruto);
};
