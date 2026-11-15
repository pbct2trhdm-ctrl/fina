#!/bin/bash
#
# Aplica uma atualização do código: instala dependências, aplica as
# migrações do banco e regenera o Prisma Client. Se o sistema estiver
# instalado como serviço (npm run servico), recompila e reinicia o serviço.

set -euo pipefail
cd "$(dirname "$0")/.."

npm install
npx prisma migrate deploy
npx prisma generate

PLIST="$HOME/Library/LaunchAgents/com.financas.casa.plist"
if [[ "$(uname)" == "Darwin" && -f "$PLIST" ]]; then
  echo "• Recompilando e reiniciando o serviço…"
  # Para o serviço durante a compilação (senão o KeepAlive tentaria religá-lo
  # sobre uma pasta .next incompleta) e o carrega de novo em seguida.
  launchctl bootout "gui/$(id -u)/com.financas.casa" 2>/dev/null || true
  rm -rf .next
  npm run build
  launchctl bootstrap "gui/$(id -u)" "$PLIST"
  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null http://localhost:3100 2>/dev/null; then
      echo "Atualização aplicada. O sistema está no ar em http://localhost:3100"
      exit 0
    fi
    sleep 2
  done
  echo "ATENÇÃO: o sistema não voltou em 60 segundos. Veja ~/Library/Logs/financas-casa.log" >&2
  exit 1
fi

echo "Atualização aplicada. Ligue o sistema com: npm run dev"
