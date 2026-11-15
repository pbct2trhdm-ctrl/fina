#!/usr/bin/env node
/**
 * Cópia de segurança do banco (npm run backup): grava dev.db com data e hora
 * em BACKUP_LOCAL_DIR (padrão ./backups) e, se BACKUP_ONEDRIVE_DIR estiver
 * definido, também na pasta do OneDrive. Apaga cópias com mais de
 * BACKUP_RETENCAO_DIAS dias (padrão 30).
 */
import "dotenv/config";
import { createReadStream, createWriteStream, copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { pipeline } from "node:stream/promises";
import { setTimeout as esperar } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(PROJECT_ROOT, "dev.db");
const LOCAL_BACKUP_DIR = process.env.BACKUP_LOCAL_DIR ? path.resolve(process.env.BACKUP_LOCAL_DIR) : path.join(PROJECT_ROOT, "backups");
const ONEDRIVE_DIR = process.env.BACKUP_ONEDRIVE_DIR ? path.resolve(process.env.BACKUP_ONEDRIVE_DIR) : null;
const RETENCAO_DIAS = Number(process.env.BACKUP_RETENCAO_DIAS ?? 30);
const PREFIXO = "financas-casa_";

function timestamp() {
  const agora = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}_${pad(agora.getHours())}${pad(agora.getMinutes())}`;
}

/**
 * A pasta ~/Library/CloudStorage é gerenciada pelo app do OneDrive, que às
 * vezes recusa a cópia nativa com EAGAIN. Nesse caso copia como fluxo de bytes
 * comum, tentando algumas vezes (mesma solução do sistema do escritório).
 */
async function copiarParaOneDrive(origem, destino) {
  try {
    copyFileSync(origem, destino);
    return;
  } catch (erro) {
    console.warn(`Cópia rápida para o OneDrive recusada (${erro.code ?? erro.message}); tentando cópia comum...`);
  }
  let ultimoErro;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      await pipeline(createReadStream(origem), createWriteStream(destino));
      return;
    } catch (erro) {
      ultimoErro = erro;
      await esperar(1000 * tentativa);
    }
  }
  throw ultimoErro;
}

function apagarAntigos(pasta) {
  const limite = Date.now() - RETENCAO_DIAS * 24 * 60 * 60 * 1000;
  for (const nome of readdirSync(pasta)) {
    if (!nome.startsWith(PREFIXO) || !nome.endsWith(".db")) continue;
    const caminho = path.join(pasta, nome);
    if (statSync(caminho).mtimeMs < limite) {
      unlinkSync(caminho);
      console.log(`Backup antigo removido: ${caminho}`);
    }
  }
}

if (!existsSync(DB_PATH)) {
  console.error(`Banco de dados não encontrado em ${DB_PATH}.`);
  process.exit(1);
}

mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
const nome = `${PREFIXO}${timestamp()}.db`;
const destinoLocal = path.join(LOCAL_BACKUP_DIR, nome);

// backup() do SQLite gera uma cópia íntegra mesmo com o sistema aberto.
const banco = new Database(DB_PATH, { readonly: true });
await banco.backup(destinoLocal);
banco.close();
console.log(`Backup gravado: ${destinoLocal}`);
apagarAntigos(LOCAL_BACKUP_DIR);

if (ONEDRIVE_DIR) {
  try {
    mkdirSync(ONEDRIVE_DIR, { recursive: true });
    await copiarParaOneDrive(destinoLocal, path.join(ONEDRIVE_DIR, nome));
    console.log(`Cópia no OneDrive: ${path.join(ONEDRIVE_DIR, nome)}`);
    apagarAntigos(ONEDRIVE_DIR);
  } catch (erro) {
    console.error(`Falha ao copiar para o OneDrive (${erro.message}). O backup local foi mantido.`);
    process.exitCode = 1;
  }
}
