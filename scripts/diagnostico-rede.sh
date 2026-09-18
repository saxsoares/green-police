#!/usr/bin/env bash
# -------------------------------------------------------------
# SIMIA-Verde — Diagnóstico de alcance de rede
#
# Testa a cadeia de fora para dentro e aponta ONDE ela se rompe:
#   contêiner → porta publicada no host → loopback → IP da rede → firewall
#
# Uso no servidor:  bash scripts/diagnostico-rede.sh
# -------------------------------------------------------------
set -uo pipefail

PORTA="${SIMIA_PORT:-3000}"
SERVICO="simia"
ok()    { printf '  \033[32m✓\033[0m %s\n' "$1"; }
falha() { printf '  \033[31m✗\033[0m %s\n' "$1"; }
aviso() { printf '  \033[33m!\033[0m %s\n' "$1"; }
titulo(){ printf '\n\033[1m%s\033[0m\n' "$1"; }

titulo "1. O contêiner está rodando?"
if ! docker compose ps --format '{{.Name}} {{.Status}}' 2>/dev/null | grep -q .; then
  falha "Nenhum contêiner do compose em execução."
  echo "     → docker compose up -d --build"
  exit 1
fi
docker compose ps --format '  {{.Name}}: {{.Status}}'
if docker compose ps --format '{{.Status}}' | grep -qi 'unhealthy'; then
  falha "Contêiner UNHEALTHY — a aplicação subiu mas não responde ao healthcheck."
  echo "     → docker compose logs --tail=40 $SERVICO"
fi

titulo "2. A porta está publicada pelo Docker?"
MAPA="$(docker compose port "$SERVICO" 3000 2>/dev/null || true)"
if [ -n "$MAPA" ]; then
  ok "Publicada em: $MAPA"
  case "$MAPA" in
    127.0.0.1:*)
      aviso "Publicada SOMENTE em loopback — inacessível pela rede."
      echo "     → remova SIMIA_BIND=127.0.0.1 do .env (ou ajuste para 0.0.0.0)"
      ;;
  esac
else
  falha "Docker não publicou a porta."
  echo "     → verifique a seção 'ports:' do docker-compose.yml"
fi

titulo "3. O host está escutando na porta $PORTA?"
if command -v ss >/dev/null 2>&1; then
  LINHA="$(ss -tlnp 2>/dev/null | grep ":$PORTA " || true)"
elif command -v netstat >/dev/null 2>&1; then
  LINHA="$(netstat -tlnp 2>/dev/null | grep ":$PORTA " || true)"
else
  LINHA=""; aviso "ss/netstat indisponíveis — etapa pulada."
fi
if [ -n "$LINHA" ]; then
  echo "$LINHA" | sed 's/^/  /'
  echo "$LINHA" | grep -q '127.0.0.1' && aviso "Escutando só em 127.0.0.1." || ok "Escutando em todas as interfaces."
else
  # Informativo, nao conclusivo: em ambientes sem visibilidade de sockets
  # (Git Bash no Windows, contêineres sem privilegio) ss nao enxerga nada.
  # A etapa 4 e a verificacao definitiva.
  aviso "Socket nao localizado por ss/netstat — veja a etapa 4, que e conclusiva."
fi

titulo "4. Responde no próprio servidor (loopback)?"
if curl -fsS --max-time 8 "http://127.0.0.1:$PORTA/api/health" >/dev/null 2>&1; then
  ok "http://127.0.0.1:$PORTA/api/health respondeu"
else
  falha "Não respondeu no loopback — o problema é a APLICAÇÃO, não a rede."
  echo "     → docker compose logs --tail=40 $SERVICO"
fi

titulo "5. Responde no IP da rede?"
IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ -n "${IP:-}" ]; then
  if curl -fsS --max-time 8 "http://$IP:$PORTA/api/health" >/dev/null 2>&1; then
    ok "http://$IP:$PORTA respondeu — acesse por este endereço"
  else
    falha "Não respondeu em $IP:$PORTA — provável bloqueio de firewall."
  fi
else
  aviso "Não foi possível determinar o IP do host."
fi

titulo "6. Firewall"
if command -v ufw >/dev/null 2>&1; then
  ST="$(sudo -n ufw status 2>/dev/null || ufw status 2>/dev/null || echo 'sem permissão')"
  echo "$ST" | head -12 | sed 's/^/  /'
  if echo "$ST" | grep -qi '^Status: active'; then
    echo "$ST" | grep -q "$PORTA" \
      && ok "Há regra para a porta $PORTA" \
      || { falha "ufw ATIVO e sem regra para $PORTA"; echo "     → sudo ufw allow $PORTA/tcp"; }
  fi
else
  aviso "ufw não instalado — verifique iptables/nftables ou o firewall do provedor."
fi

titulo "Resumo"
echo "  Se 4 respondeu e 5 não: firewall do host ou security group do provedor (nuvem)."
echo "  Se 4 também falhou: a aplicação não está saudável — veja os logs."
echo "  Acesse em: http://${IP:-<ip-do-servidor>}:$PORTA"
