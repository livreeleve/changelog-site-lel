#!/usr/bin/env node
import { buildEntry, getDefaultAuthor, isValidType, normalizeDate, upsertEntry } from './changelog-lib.mjs';

// Uso:
// npm run feat "Título" "Descrição" ["Autor"] ["Link"] ["HH:MM:SS"] ["YYYY-MM-DD"]
// npm run fix  ...
// npm run chore ...

const [, , typeArg, title, description, authorArg, link, time, dateArg] = process.argv;

if (!isValidType(typeArg)) {
  console.error('Tipo inválido. Use: feature | fix | chore');
  process.exit(1);
}
if (!title) {
  console.error('Faltou "Título". Ex.: npm run feat "Novo carrossel" "Descrição"');
  process.exit(1);
}

const author = authorArg && authorArg.trim() ? authorArg : getDefaultAuthor();
const date = normalizeDate(dateArg);

const entry = buildEntry({
  type: typeArg.toLowerCase(),
  title,
  description: description || '',
  author,
  date,
  time,
  link
});

const saved = upsertEntry(entry);
console.log('✅ Adicionado:', saved);
