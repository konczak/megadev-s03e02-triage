#!/usr/bin/env node
// Checks doc/issues/ against the triage rules. Run from the repo root.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join('doc', 'issues');
const list = (v) => (v ? v.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim()).filter(Boolean) : []);
const issues = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => {
  const text = readFileSync(join(dir, f), 'utf8').replace(/\r/g, '');
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { f, bad: 'no frontmatter' };
  const fm = Object.fromEntries(m[1].split('\n').map((l) => l.replace(/\s+#.*$/, '')).filter((l) => l.includes(':'))
    .map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]));
  return { f, fm, body: m[2] };
});

const errs = [];
const keys = new Set(issues.map((i) => i.fm?.key));
const sourced = new Set(issues.flatMap((i) => list(i.fm?.sources)));
const requests = new Set();
for (const i of issues) {
  if (i.bad) { errs.push(`${i.f}: ${i.bad}`); continue; }
  const { fm, body } = i;
  for (const s of list(fm.sources)) requests.add(s);
  if (fm.key.startsWith('IN-')) requests.add(fm.key);
  const labels = list(fm.labels);
  const marks = labels.filter((l) => l === 'agent-ready' || l === 'needs-human');
  if (fm.status === 'open') {
    if (marks.length !== 1) errs.push(`${i.f}: open with ${marks.length} marks`);
    if (marks[0] === 'agent-ready') {
      for (const h of ['## Intent', '## Acceptance', '## Boundaries']) if (!body.includes(h)) errs.push(`${i.f}: no ${h}`);
      if (!/AUT-1/.test(body)) errs.push(`${i.f}: no AUT-1 citation`);
      if (!/\bnot\b/.test(body.split('## Acceptance')[1]?.split('## Boundaries')[0] ?? '')) errs.push(`${i.f}: no must-not case`);
    }
    if (marks[0] === 'needs-human') {
      for (const h of ['## Question', '## Options', '## Recommendation', '## Why']) if (!body.includes(h)) errs.push(`${i.f}: no ${h}`);
      if (!/(AUT|DES|PRD|ADR)-\d|SCHED-\d|IN-\d/.test(body)) errs.push(`${i.f}: no cited id`);
    }
  } else if (fm.status === 'closed') {
    if (!['duplicate', 'obsolete', 'contradicts-spec', 'not-planned'].includes(fm.reason)) errs.push(`${i.f}: closed without valid reason`);
    if (fm.reason === 'duplicate' && !keys.has(fm['duplicate-of'])) errs.push(`${i.f}: duplicate-of missing or unknown`);
    if (marks.length) errs.push(`${i.f}: closed but still marked`);
  } else if (fm.status !== 'done') errs.push(`${i.f}: bad status ${fm.status}`);
  for (const b of list(fm['blocked-by'])) if (!keys.has(b)) errs.push(`${i.f}: blocked-by unknown ${b}`);
}
for (const r of requests) if (!sourced.has(r)) errs.push(`${r}: in no issue's sources`);
console.log(errs.length ? errs.join('\n') : `ok: ${issues.length} issues, ${requests.size} requests`);
process.exit(errs.length ? 1 : 0);
