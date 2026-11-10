#!/usr/bin/env node
// Files the triaged doc/issues/*.md into GitHub Issues of the current repo, with gh.
// Run from the repo root:  node .agents/skills/triage/file-gh.mjs [--dry]
// Remembers what it filed in .sched/gh.json (the same file the collectors' gh sink reads),
// so a re-run, or a later `collectors/all.mjs --sink gh`, never files an issue twice.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DRY = process.argv.includes('--dry');
const STATE = join('.sched', 'gh.json');
const list = (v) => (v ? v.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim()).filter(Boolean) : []);

function gh(args) {
  if (DRY) { console.log('gh', args.map((a) => (a.length > 60 ? `${a.slice(0, 57)}...` : a)).join(' ')); return `https://github.com/dry/issues/${Math.floor(Math.random() * 1e6)}`; }
  const out = spawnSync('gh', args, { encoding: 'utf8' });
  if (out.error) throw new Error(`gh: ${out.error.message}`);
  if (out.status !== 0) throw new Error(`gh ${args.slice(0, 2).join(' ')}: ${out.stderr.trim()}`);
  return out.stdout.trim();
}

const issues = readdirSync(join('doc', 'issues')).filter((f) => f.endsWith('.md')).sort((a, b) => {
  const r = (f) => (f.startsWith('SCHED-') ? 0 : 1); // backlog first
  return r(a) - r(b) || a.localeCompare(b);
}).map((f) => {
  const text = readFileSync(join('doc', 'issues', f), 'utf8').replace(/\r/g, '');
  const [, head, body] = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const fm = Object.fromEntries(head.split('\n').filter((l) => l.includes(':'))
    .map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]));
  fm.title = JSON.parse(fm.title);
  return { fm, body: body.trim() };
});

const filed = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {};
const save = () => { if (!DRY) { mkdirSync('.sched', { recursive: true }); writeFileSync(STATE, `${JSON.stringify(filed, null, 2)}\n`); } };

// 1. labels (gh refuses a label that does not exist)
const labels = new Set(issues.flatMap(({ fm }) => list(fm.labels)));
for (const { fm } of issues) if (['obsolete', 'contradicts-spec'].includes(fm.reason)) labels.add(`reason:${fm.reason}`);
for (const l of labels) gh(['label', 'create', l, '--force']);

// 2. create every issue (open first, so duplicate targets exist before any close)
for (const { fm, body } of issues) {
  if (filed[fm.key]) continue;
  const meta = [`key: ${fm.key}`, `sources: ${list(fm.sources).join(', ')}`];
  if (fm['blocked-by']) meta.push(`blocked-by: ${list(fm['blocked-by']).join(', ')}`);
  if (fm['duplicate-of']) meta.push(`duplicate-of: ${fm['duplicate-of']}`);
  const ls = [...list(fm.labels), ...(['obsolete', 'contradicts-spec'].includes(fm.reason) ? [`reason:${fm.reason}`] : [])];
  filed[fm.key] = gh(['issue', 'create', '--title', `${fm.key} · ${fm.title}`, '--body', `${body}\n\n${meta.join('\n')}`, ...ls.flatMap((l) => ['--label', l])]);
  save();
}

// 3. close what is not open
for (const { fm } of issues) {
  const url = filed[fm.key];
  if (fm.status === 'open') continue;
  if (!DRY) {
    const state = JSON.parse(gh(['issue', 'view', url, '--json', 'state'])).state;
    if (state === 'CLOSED') continue;
  }
  if (fm.status === 'done') gh(['issue', 'close', url, '--reason', 'completed']);
  else if (fm.reason === 'duplicate') gh(['issue', 'close', url, '--duplicate-of', filed[fm['duplicate-of']]]);
  else gh(['issue', 'close', url, '--reason', 'not planned']);
}
console.log(`${Object.keys(filed).length} issues filed`);
