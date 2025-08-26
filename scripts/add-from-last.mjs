#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { buildEntry, getDefaultAuthor, isValidType, normalizeDate, upsertEntry } from './changelog-lib.mjs';

function getLastCommitMessage() {
  return execSync('git log -1 --pretty=%B', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}

function parseCommit(msg) {
  // Primeira linha: feat|fix|chore(scope)?: título
  const [first, ...rest] = msg.split(/\r?\n/);
  const m = first.match(/^(feat|fix|chore)(?:\([^)]+\))?:\s*(.+)$/i);
  if (!m) return null;
  const type = m[1].toLowerCase();
  const title = m[2].trim();

  // Corpo -> descrição e primeiro link (se houver)
  const body = rest.join('\n').trim();
  const linkMatch = body.match(/https?:\/\/\S+/);
  const link = linkMatch ? linkMatch[0] : undefined;

  return { type, title, description: body, link };
}

try {
  const msg = getLastCommitMessage();
  const parsed = parseCommit(msg);
  if (!parsed || !isValidType(parsed.type)) {
    console.error('Último commit não segue Conventional Commits (feat|fix|chore). Ex.: "fix: corrige zoom"');
    process.exit(1);
  }

  const author = getDefaultAuthor();
  const date = normalizeDate('');

  const entry = buildEntry({
    type: parsed.type,
    title: parsed.title,
    description: parsed.description,
    author,
    date,
    link: parsed.link
  });

  const saved = upsertEntry(entry);
  console.log('✅ Adicionado via commit:', saved);
} catch (e) {
  console.error('Erro:', e.message);
  process.exit(1);
}
