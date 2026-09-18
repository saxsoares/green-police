/**
 * Preferência de tema da estação de trabalho.
 *
 * Fica no localStorage do navegador do operador — é conveniência de exibição,
 * não dado pericial, e por isso não entra na base durável nem no bloco de custódia.
 */

export type Tema = 'claro' | 'escuro';

const CHAVE_TEMA = 'simia_tema_v1';

/**
 * Lê a preferência salva; na ausência dela, segue a preferência do sistema
 * operacional. Em campo, à noite, o padrão do SO costuma ser o que o operador quer.
 */
export function carregarTema(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    if (salvo === 'claro' || salvo === 'escuro') return salvo;
  } catch {
    // localStorage pode estar bloqueado; segue para a preferência do sistema.
  }

  try {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'escuro';
  } catch {
    // ignore
  }

  return 'claro';
}

export function salvarTema(tema: Tema): void {
  try {
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // Sem persistência, o tema vale apenas para esta sessão.
  }
}

/**
 * Aplica o tema no elemento <html>. Todo o CSS do tema escuro está ancorado em
 * `html[data-theme="dark"]` (ver index.css).
 */
export function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement;
  if (tema === 'escuro') {
    raiz.setAttribute('data-theme', 'dark');
  } else {
    raiz.removeAttribute('data-theme');
  }
}
