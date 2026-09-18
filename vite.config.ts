import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import browserslist from 'browserslist';
import {browserslistToTargets} from 'lightningcss';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * Alvo de compatibilidade: Chrome/Edge 109.
 *
 * 109 é a última versão dessas duas famílias que roda em Windows 7/8.1 — parque
 * ainda presente em estações de delegacia e de unidade operacional.
 *
 * O TailwindCSS 4 emite a paleta em `oklch()` e os modificadores de opacidade
 * (`bg-white/50`) em `color-mix()`. Ambos exigem Chrome 111+; no 109 a declaração
 * é inválida e o navegador a DESCARTA — o resultado é a interface carregando sem
 * cor nem fundo, que foi o sintoma relatado.
 *
 * O LightningCSS rebaixa essas funções para RGB de acordo com os alvos abaixo.
 */
const ALVOS = browserslistToTargets(
  browserslist(['chrome >= 109', 'edge >= 109', 'firefox >= 115', 'safari >= 15.6'])
);

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    css: {
      transformer: 'lightningcss' as const,
      lightningcss: { targets: ALVOS }
    },
    build: {
      // esbuild/rolldown mantêm a sintaxe JS dentro do que o Chrome 109 executa.
      target: ['chrome109', 'edge109', 'firefox115', 'safari15.6'],
      cssMinify: 'lightningcss' as const
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
