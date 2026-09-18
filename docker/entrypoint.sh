#!/bin/sh
# -------------------------------------------------------------
# SIMIA-Verde — entrypoint
#
# PROBLEMA QUE ISTO RESOLVE
# A base pericial é um bind mount (./data do host → /app/data). Um bind mount
# SUBSTITUI o diretório da imagem em tempo de execução e carrega a propriedade
# do host — então o `chown node:node` feito no Dockerfile não vale para ele.
# No Linux o Docker cria a pasta de origem ausente como root:root, e o processo
# rodando como `node` (uid 1000) não consegue gravar: SQLITE_CANTOPEN, crash loop.
#
# (No Docker Desktop para Windows/macOS isso não aparece: a camada de
# virtualização de arquivos ignora as permissões Unix.)
#
# ESTRATÉGIA
# Inicia como root apenas para garantir que o diretório de dados seja gravável
# pelo usuário de execução, e então REBAIXA o privilégio com setpriv (já presente
# no util-linux da imagem base — sem pacote adicional). O processo da aplicação
# nunca roda como root.
# -------------------------------------------------------------
set -eu

USUARIO_APP="${SIMIA_USER:-node}"
DIR_DADOS="$(dirname "${SIMIA_DB_PATH:-/app/data/simia.db}")"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DIR_DADOS"

  # Só ajusta a propriedade quando necessário: num diretório grande (backup de
  # dossiês antigos) um chown -R incondicional atrasaria a subida do contêiner.
  DONO_ATUAL="$(stat -c '%U' "$DIR_DADOS" 2>/dev/null || echo '?')"
  if [ "$DONO_ATUAL" != "$USUARIO_APP" ]; then
    echo "[SIMIA] Ajustando propriedade de $DIR_DADOS ($DONO_ATUAL -> $USUARIO_APP)"
    chown -R "$USUARIO_APP":"$USUARIO_APP" "$DIR_DADOS" 2>/dev/null || {
      echo "[SIMIA] AVISO: não foi possível alterar a propriedade de $DIR_DADOS."
      echo "[SIMIA] Se o volume for somente-leitura ou de rede (NFS/CIFS), ajuste no host:"
      echo "[SIMIA]   sudo chown -R 1000:1000 ./data"
    }
  fi

  exec setpriv --reuid="$USUARIO_APP" --regid="$USUARIO_APP" --init-groups "$@"
fi

# Já sem privilégio de root (ex.: `user:` definido no compose): apenas valida
# que dá para gravar, e falha cedo com mensagem útil em vez de stack trace.
mkdir -p "$DIR_DADOS" 2>/dev/null || true
if [ ! -w "$DIR_DADOS" ]; then
  echo "[SIMIA] ERRO: $DIR_DADOS não é gravável pelo usuário $(id -un) (uid $(id -u))."
  echo "[SIMIA] Corrija no host:  sudo chown -R $(id -u):$(id -g) ./data"
  exit 1
fi

exec "$@"
