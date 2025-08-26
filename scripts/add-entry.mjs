#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// ---------- utils ----------
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
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
    } // ignoramos posicionais
  }
  return args;
}

function requireArg(args, name) {
  if (!args[name] || args[name] === true) {
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
const date = (args.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
const link = args.link;

const raw = JSON.parse(readFileSync(file, 'utf-8'));
raw.entries ||= [];

const id = `${date}-${String(raw.entries.length + 1).padStart(2, '0')}`;
const entry = { id, date, type, title, description, author };
if (link) entry.links = [{ label: 'Ref', url: link }];

raw.entries.push(entry);
raw.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

writeFileSync(file, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
console.log('✅ Adicionado:', entry);
