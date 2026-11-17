#!/bin/bash
#
# Instala a cópia de segurança automática: todo dia às 20h15 o macOS (launchd)
# roda `node scripts/backup.mjs`, que grava o banco em backups/ e, se
# BACKUP_ONEDRIVE_DIR estiver no .env, também na pasta do OneDrive.
#
# Uso:
#   bash scripts/instalar-rotinas.sh            instala/atualiza
#   bash scripts/instalar-rotinas.sh --remover  remove

set -euo pipefail

PROJETO="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.financas.backup.plist"
LOG="$HOME/Library/Logs/financas-casa-backup.log"
ALVO="gui/$(id -u)/com.financas.backup"

if [[ "${1:-}" == "--remover" ]]; then
  launchctl bootout "$ALVO" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Backup automático removido."
  exit 0
fi

if [[ "$(uname)" != "Darwin" ]]; then
  echo "Este script é para macOS." >&2
  exit 1
fi

NODE="$(command -v node || true)"
if [[ -z "$NODE" ]]; then
  echo "Node.js não encontrado." >&2
  exit 1
fi

mkdir -p "$(dirname "$PLIST")" "$(dirname "$LOG")"
launchctl bootout "$ALVO" 2>/dev/null || true
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.financas.backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE</string>
        <string>scripts/backup.mjs</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJETO</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$(dirname "$NODE"):/usr/local/bin:/usr/bin:/bin</string>
    </dict>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>20</integer>
        <key>Minute</key>
        <integer>15</integer>
    </dict>
    <key>RunAtLoad</key>
    <false/>
    <key>StandardOutPath</key>
    <string>$LOG</string>
    <key>StandardErrorPath</key>
    <string>$LOG</string>
</dict>
</plist>
PLIST
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "Backup automático instalado: todo dia às 20h15."
grep -q '^BACKUP_ONEDRIVE_DIR=' "$PROJETO/.env" 2>/dev/null \
  && echo "• Cópia no OneDrive: $(grep '^BACKUP_ONEDRIVE_DIR=' "$PROJETO/.env" | cut -d= -f2-)" \
  || echo "• Só cópia local (backups/). Para copiar ao OneDrive, defina BACKUP_ONEDRIVE_DIR no .env e rode de novo."
echo "• Log: $LOG"
echo "• Para rodar agora: launchctl kickstart $ALVO"
