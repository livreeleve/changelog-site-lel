#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// ---------- utils ----------
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const tok = argv[i];
    if (!tok.startsWith('--')) continue;

    const eq = tok.indexOf('=');
    if (eq !== -1) {
      const key = tok.slice(2, eq);
      const val = tok.slice(eq + 1);
      args[key] = val === '' ? true : val;
    } else {
      const key = tok.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function requireArg(args, name) {
  if (!Object.prototype.hasOwnProperty.call(args, name) || args[name] === true || args[name] === '') {
    console.error(`Faltou --${name}=valor (ou --${name} "valor")`);
    process.exit(1);
  }
  return args[name];
}

// ---------- main ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');
const file = resolve(root, 'data', 'changelog.json');

const args = parseArgs(process.argv);
const allowedTypes = new Set(['feature', 'fix', 'chore']);

const type = requireArg(args, 'type').toLowerCase();
if (!allowedTypes.has(type)) {
  console.error(`--type inválido: "${type}". Use: feature | fix | chore`);
  process.exit(1);
}

const title = requireArg(args, 'title');
const description = args.desc || args.description || '';
const author = args.author || 'Equipe';

// Normaliza data (ISO yyyy-mm-dd)
let date = (args.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
// Hora opcional
const time = args.time || null;

// Carrega JSON
const raw = JSON.parse(readFileSync(file, 'utf-8'));
if (!raw.entries || !Array.isArray(raw.entries)) raw.entries = [];

// Sequência por dia para ID humano
const seq = 1 + raw.entries.filter(e => e.date === date).length;
const id = `${date}-${String(seq).padStart(3, '0')}`;

// Timestamp para desempate e auditoria
const createdAt = new Date().toISOString();

const entry = { id, date, type, title, description, author, createdAt };
if (time) entry.time = time;
if (args.link) entry.links = [{ label: 'Ref', url: args.link }];

raw.entries.push(entry);

// Ordena DESC por date → time → createdAt
raw.entries.sort((a, b) =>
  (b.date || '').localeCompare(a.date || '') ||
  (b.time || '00:00:00').localeCompare(a.time || '00:00:00') ||
  (b.createdAt || '').localeCompare(a.createdAt || '')
);

// Salva
writeFileSync(file, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
console.log('✅ Adicionado:', entry);
