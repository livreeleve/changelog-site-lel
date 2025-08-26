#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';


// Uso:
// node scripts/add-entry.mjs --type fix --title "Corrige bug X" --desc "Detalhes" --author "Lucas" --link "https://..." --date "2025-08-26"


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');
const file = resolve(root, 'data', 'changelog.json');


const args = Object.fromEntries(process.argv.slice(2).map(a => {
const [k, ...rest] = a.replace(/^--/, '').split('=');
const v = rest.join('=');
return [k, v || true];
}));


function requireArg(name) {
if (!args[name]) { console.error(`Faltou --${name}`); process.exit(1); }
return args[name];
}


const type = requireArg('type'); // feature|fix|chore
const title = requireArg('title');
const description = args.desc || args.description || '';
const author = args.author || 'Equipe';
const date = args.date || new Date().toISOString().slice(0,10); // YYYY-MM-DD
const link = args.link; // opcional


const raw = JSON.parse(readFileSync(file, 'utf-8'));
raw.entries ||= [];


const id = `${date}-${String(raw.entries.length + 1).padStart(2,'0')}`;
const entry = { id, date, type, title, description, author };
if (link) {
entry.links = [{ label: 'Ref', url: link }];
}


raw.entries.push(entry);
// Ordena por data desc (por via das dúvidas)
raw.entries.sort((a, b) => new Date(b.date) - new Date(a.date));


writeFileSync(file, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
console.log('✅ Adicionado:', entry);