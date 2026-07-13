// URL base da API. Em desenvolvimento cai no localhost; em producao, defina
// VITE_API_URL no ambiente de build (ex.: https://api.uemurafloresplantas.com.br).
// Concentrar aqui evita cacar "localhost:3001" espalhado pelos componentes na hora
// de publicar.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Le o corpo JSON de uma resposta de forma segura. Se o corpo vier vazio (servidor
// reiniciando, conexao cortada, timeout), retorna {} em vez de estourar
// "Unexpected end of JSON input" na cara do usuario. Passe um fallback para casos
// que esperam array.
export async function parseJson<T = any>(response: Response, fallback: T = {} as T): Promise<T> {
  const texto = await response.text();
  if (!texto) return fallback;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return fallback;
  }
}
