#!/usr/bin/env node
import { buildEntry, getDefaultAuthor, isValidType, upsertEntry } from './changelog-lib.mjs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

async function ask(q, def = '') {
  const a = await rl.question(def ? `${q} (${def}): ` : `${q}: `);
  return a.trim() || def;
}

(async () => {
  try {
    const type = (await ask('Tipo [feature|fix|chore]', 'feature')).toLowerCase();
    if (!isValidType(type)) throw new Error('Tipo inválido. Use feature|fix|chore.');

    const title = await ask('Título');
    if (!title) throw new Error('Título é obrigatório.');

    const description = await ask('Descrição', '');
    const author = await ask('Autor', getDefaultAuthor());
    const link = await ask('Link (opcional)', '');

    // Data e hora são automáticas dentro de buildEntry()
    const entry = buildEntry({
      type, title, description, author,
      link: link || undefined
    });

    const saved = upsertEntry(entry);
    console.log('\n✅ Adicionado:', saved);
  } catch (e) {
    console.error('Erro:', e.message);
    process.exit(1);
  } finally {
    rl.close();
  }
})();
