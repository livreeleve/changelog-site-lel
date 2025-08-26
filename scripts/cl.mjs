#!/usr/bin/env node
import { buildEntry, getDefaultAuthor, isValidType, upsertEntry } from './changelog-lib.mjs';

// Uso:
// npm run feat  "Título" "Descrição" ["Autor"] ["Link"]
// npm run fix   "Título" "Descrição" ["Autor"] ["Link"]
// npm run chore "Título" "Descrição" ["Autor"] ["Link"]

const [, , typeArg, title, description, authorArg, link] = process.argv;

if (!isValidType(typeArg)) {
  console.error('Tipo inválido. Use: feature | fix | chore');
  process.exit(1);
}
if (!title) {
  console.error('Faltou "Título". Ex.: npm run feat "Novo carrossel" "Descrição"');
  process.exit(1);
}

const author = (authorArg && authorArg.trim()) ? authorArg : getDefaultAuthor();
const entry = buildEntry({
  type: typeArg.toLowerCase(),
  title,
  description: description || '',
  author,
  link
});

const saved = upsertEntry(entry);
console.log('✅ Adicionado:', saved);
