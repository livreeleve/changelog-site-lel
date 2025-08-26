import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');
const dataDir = resolve(root, 'data');
const changelogPath = resolve(dataDir, 'changelog.json');

// ------- Infra básica -------
export function ensureChangelog() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(changelogPath)) {
    const initial = { project: 'Livre e Leve — Site', entries: [] };
    writeFileSync(changelogPath, JSON.stringify(initial, null, 2) + '\n', 'utf-8');
  }
}
export function loadChangelog() {
  ensureChangelog();
  const raw = JSON.parse(readFileSync(changelogPath, 'utf-8'));
  if (!raw.entries || !Array.isArray(raw.entries)) raw.entries = [];
  return raw;
}
export function saveChangelog(obj) {
  writeFileSync(changelogPath, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

// ------- Utilitários -------
export function sortDesc(a, b) {
  return (b.date || '').localeCompare(a.date || '') ||
         (b.time || '00:00:00').localeCompare(a.time || '00:00:00') ||
         (b.createdAt || '').localeCompare(a.createdAt || '');
}

export function getDefaultAuthor() {
  try {
    const name = execSync('git config user.name', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
    return name || 'Equipe';
  } catch {
    return 'Equipe';
  }
}

export function nowInTZ(tz = 'America/Sao_Paulo') {
  // Constrói data/hora locais no fuso informado, sem libs externas
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(new Date()).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  const date = `${parts.year}-${parts.month}-${parts.day}`;       // YYYY-MM-DD
  const time = `${parts.hour}:${parts.minute}:${parts.second}`;    // HH:MM:SS
  return { date, time };
}

export function nextIdForDate(entries, date) {
  const seq = 1 + entries.filter(e => e.date === date).length;
  return `${date}-${String(seq).padStart(3, '0')}`;
}

export function isValidType(t) {
  return ['feature', 'fix', 'chore'].includes(String(t).toLowerCase());
}

// ------- Construção/Upsert -------
export function buildEntry({ type, title, description = '', author, link }) {
  const { date, time } = nowInTZ('America/Sao_Paulo');   // <-- sempre automático
  const createdAt = new Date().toISOString();            // ISO em UTC (auditável)
  const entry = { id: '', date, time, type, title, description, author, createdAt };
  if (link) entry.links = [{ label: 'Ref', url: link }];
  return entry;
}

export function upsertEntry(entry) {
  const raw = loadChangelog();
  entry.id = nextIdForDate(raw.entries, entry.date);
  raw.entries.push(entry);
  raw.entries.sort(sortDesc);
  saveChangelog(raw);
  return entry;
}
