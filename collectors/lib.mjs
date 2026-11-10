// Shared by the collectors: the API, the cursor store, and the two tracker sinks.
// Zero dependencies, Node 18 or newer (built-in fetch).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const CHANNELS = ['desk', 'chat', 'mail'];
const STATE = '.sched';
const ISSUES = join('doc', 'issues');

/** --api, --session, --sink from the command line, or SCHED_API / SCHED_SESSION / SCHED_SINK. */
export function options() {
  const arg = (name) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 ? process.argv[i + 1] : process.env[`SCHED_${name.toUpperCase()}`];
  };
  const api = arg('api')?.replace(/\/+$/, '');
  const session = arg('session');
  const sink = arg('sink') ?? 'md';
  if (!api || !session || !['md', 'gh'].includes(sink)) {
    console.error('usage: node collectors/<name>.mjs --api <api url> --session <session token> [--sink md|gh]');
    process.exit(2);
  }
  return { api, session, sink };
}

export async function get({ api, session }, path, query = {}) {
  const qs = new URLSearchParams({ t: session, ...query });
  const res = await fetch(`${api}${path}?${qs}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: ${res.status} ${body.message ?? ''}`.trim());
  return body;
}

// --- where each channel left off: .sched/cursors.json, per session ---
function readState(name) {
  const path = join(STATE, name);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
}
function writeState(name, value) {
  mkdirSync(STATE, { recursive: true });
  writeFileSync(join(STATE, name), `${JSON.stringify(value, null, 2)}\n`);
}

/** One channel's new requests since the last run (the cursor is kept in .sched/). */
export async function pollChannel(opts, channel) {
  const state = readState('cursors.json');
  const mine = state.session === opts.session ? state.cursors ?? {} : {};
  const page = await get(opts, `/channels/${channel}`, mine[channel] ? { since: mine[channel] } : {});
  writeState('cursors.json', { session: opts.session, cursors: { ...mine, [channel]: page.cursor } });
  return page.items;
}

// --- issue shapes ---
const oneLine = (s) => s.replace(/\s+/g, ' ').trim();

export const backlogIssue = (b) => ({ key: b.key, title: b.title, status: b.status, labels: b.labels, sources: [], body: b.body });

export function requestIssue(item, channel) {
  return {
    key: item.id,
    title: oneLine(item.text).slice(0, 72),
    status: 'open',
    labels: [`from:${item.from}`],
    sources: [item.id],
    body: [item.text, '', `channel: ${channel}`, ...(item.reporter ? [`reporter: ${item.reporter}`] : [])].join('\n'),
  };
}

// --- md sink: doc/issues/<key>.md; a file that is already there is left alone ---
function mdText(issue) {
  const list = (xs) => `[${xs.join(', ')}]`;
  const fm = [`key: ${issue.key}`, `title: ${JSON.stringify(issue.title)}`, `status: ${issue.status}`, `labels: ${list(issue.labels)}`];
  if (issue.sources.length) fm.push(`sources: ${list(issue.sources)}`);
  return `---\n${fm.join('\n')}\n---\n\n${issue.body}\n`;
}

function toMd(issue) {
  mkdirSync(ISSUES, { recursive: true });
  const path = join(ISSUES, `${issue.key}.md`);
  if (existsSync(path)) return false;
  writeFileSync(path, mdText(issue), 'utf8');
  return true;
}

// --- gh sink: GitHub Issues in the current repo via the gh CLI; .sched/gh.json remembers what it filed ---
/** The gh calls that file one issue (labels first: gh refuses a label that does not exist). */
export function ghCalls(issue) {
  const body = [issue.body, '', `key: ${issue.key}`, ...(issue.sources.length ? [`sources: ${issue.sources.join(', ')}`] : [])].join('\n');
  return {
    labels: issue.labels.map((l) => ['label', 'create', l, '--force']),
    create: ['issue', 'create', '--title', `${issue.key} · ${issue.title}`, '--body', body, ...issue.labels.flatMap((l) => ['--label', l])],
    close: issue.status === 'open' ? null : ['issue', 'close', '--reason', 'completed'],
  };
}

function gh(args) {
  const out = spawnSync('gh', args, { encoding: 'utf8' });
  if (out.error) throw new Error(`gh: ${out.error.message} (is the GitHub CLI installed?)`);
  if (out.status !== 0) throw new Error(`gh ${args.slice(0, 2).join(' ')}: ${out.stderr.trim()}`);
  return out.stdout.trim();
}

function toGh(issue) {
  const filed = readState('gh.json');
  if (filed[issue.key]) return false;
  const calls = ghCalls(issue);
  for (const c of calls.labels) gh(c);
  const url = gh(calls.create);
  if (calls.close) gh([...calls.close.slice(0, 2), url, ...calls.close.slice(2)]);
  writeState('gh.json', { ...filed, [issue.key]: url });
  return true;
}

/** Files the issue in the chosen tracker; false when it is already there. */
export const file = (opts, issue) => (opts.sink === 'gh' ? toGh(issue) : toMd(issue));

export function run(main) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
