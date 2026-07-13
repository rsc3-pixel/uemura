// URL base da API. Em desenvolvimento cai no localhost; em producao, defina
// VITE_API_URL no ambiente de build (ex.: https://api.uemurafloresplantas.com.br).
// Concentrar aqui evita cacar "localhost:3001" espalhado pelos componentes na hora
// de publicar.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
