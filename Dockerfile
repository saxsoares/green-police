# -------------------------------------------------------------
# SIMIA-Verde — Imagem de execução local
# SENASP / Ministério da Justiça e Segurança Pública
# -------------------------------------------------------------
# Base glibc (bookworm), não Alpine: o better-sqlite3 tem binários pré-compilados
# para glibc, evitando compilação nativa no build.

# ---------- Estágio 1: build ----------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Ferramentas de compilação como rede de segurança: se não houver prebuild do
# better-sqlite3 para esta plataforma, o node-gyp compila a partir do fonte.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# O repositório usa bun.lock e não possui package-lock.json, então `npm ci` não se
# aplica. Ver nota sobre reprodutibilidade de build no README.
COPY package.json ./
RUN npm install

COPY . .

# Gera dist/ (front-end via Vite) e dist/server.cjs (back-end via esbuild)
RUN npm run build

# Remove devDependencies preservando o binário nativo já compilado do better-sqlite3
RUN npm prune --omit=dev

# ---------- Estágio 2: runtime ----------
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    SIMIA_DB_PATH=/app/data/simia.db

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/package.json ./package.json

# Propriedade do código da aplicação. ATENÇÃO: isto NÃO resolve o diretório de
# dados quando ele é um bind mount — o mount substitui a pasta em tempo de
# execução e traz a propriedade do host. Quem trata disso é o entrypoint.
RUN mkdir -p /app/data && chown -R node:node /app

# O entrypoint sobe como root apenas para garantir que a base pericial seja
# gravável e então rebaixa o privilégio para `node` via setpriv. A aplicação
# nunca roda como root.
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 3000

# Verifica apenas processo e banco. As APIs governamentais caem com frequência e isso
# é condição operacional normal — não deve marcar o contêiner como insalubre.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.cjs"]
