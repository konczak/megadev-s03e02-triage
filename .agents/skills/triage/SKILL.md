---
name: triage
description: Use when sched-prod requests (backlog issues and IN-… requests from desk, chat and mail) must go into the tracker in doc/issues/. Requests in, a marked tracker out - every open issue labelled agent-ready or needs-human, every request in some issue's sources, every closed issue citing what decided it.
---

# triage

Requests in, a marked tracker out. The tracker format is in `README.md` ("The issue format").
The rules come only from `specs/` (AUT-*, DES-*, PRD-*, ADR-*). Cite them by id. Never invent a rule.

## 1. Collect

From the repo root:

```
node collectors/all.mjs --api <api url> --session <session token>
```

Run it again before you hand the tracker in: channels keep getting new requests, and the cursor in
`.sched/` only returns what is new. A request filed by the collector is a raw open issue with no mark.

## 2. Read everything first

Read `specs/autonomy.md`, `specs/design.md`, `specs/product.md`, `specs/decisions/*`, then every file in
`doc/issues/`. Make one table: key, status, what it asks, who asked, which spec ids it touches.

## 3. Decide each request, in this order

1. **Already shipped?** A `done` backlog issue covers the same thing -> close the request
   `reason: duplicate`, `duplicate-of: <done key>`.
2. **Same as an open issue?** -> close the request `reason: duplicate`, `duplicate-of: <open key>`.
   Keep the older / backlog issue as the one that carries the work.
3. **Needs no work, or argues against another request?** A request that only states a constraint
   (e.g. "we rely on X, do not change it") is not work by itself: put its id in the `sources` of the
   issue it constrains, and quote it in that issue's Why. Do not file it alone.
4. **Breaks a spec** with no way to meet it -> `closed`, `reason: contradicts-spec`, cite the id.
   Out of date -> `obsolete`. Not wanted -> `not-planned`. Always say what decided it.
5. **More than one problem in one request** (look for "and", "merged by", "N reports") -> split:
   one issue per problem, each with the same request id in `sources`.
6. **Otherwise it is work.** Mark it (section 4).

Do not close, reopen or rewrite a backlog `done` issue unless a request shows it did not ship.
Never delete a backlog issue file; close it instead. The one file you may remove is a raw request file
whose id you moved into another issue's `sources` (a constraint, step 3), so it is not left open and unmarked.

## 4. Mark every open issue

`needs-human` when any of these holds (AUT-2), even if the change looks small:
- a client said they rely on the thing it changes (search the requests for "rely", "do not", "under us");
- it touches pricing, invoices or the client terms;
- it deletes or rewrites data that is already stored (retention, purge, migration of old rows);
- two requests want opposite things.

`agent-ready` only when an AUT-1 line covers it: copy changes; a bug fix or small feature inside the
specs with a test; bringing code in line with a spec with nothing visible changing; additive columns,
filters or fields; a colour scheme as a token set (DES-2); a larger text setting (DES-1); a denser
layout (DES-3). Urgency ("URGENT", a launch date) never changes the mark.

**Order:** when work can only be done after another issue (a theme needs the raw colours moved to
tokens first, DES-2 / SCHED-4412; a text size setting needs SCHED-4463; a dense layout needs
SCHED-4468), set `blocked-by: [<key>]`.

## 5. Write the issue

Frontmatter: `key, title, status, [reason], labels, sources, [blocked-by], [duplicate-of]`.
Labels: exactly one of `agent-ready` / `needs-human` on an open issue, plus `from:<who asked>`.
A backlog issue keeps its key and its `from:` label; give it `sources: []` only if no request maps to it,
otherwise list the IN- ids it answers.

agent-ready body:
```
## Intent
## Acceptance        (Given/When/Then lines, at least one "... then ... not ..." case)
## Boundaries        (Must not touch ...; respect PRD-3: an export never loses a column)
Allowed by AUT-1 (<which line>).
```

needs-human body:
```
## Question
## Options           (two or more, numbered)
## Recommendation
## Why               (the fact it rests on, by id: AUT-2, PRD-3, IN-…)
```

closed body: one or two lines that name the id that decided it.

## 6. Check before hand-in

- every IN- id appears in at least one `sources`;
- every open issue has exactly one of agent-ready / needs-human;
- every closed issue has a `reason`, and duplicates have `duplicate-of`;
- every needs-human and closed issue cites an id; every agent-ready issue names its AUT-1 line;
- every `blocked-by` key exists.

A small check script lives next to this file: `node .agents/skills/triage/check.mjs` from the repo root.

## 7. File into GitHub Issues (when the tracker lives on GitHub)

`doc/issues/` is the staging copy you triage in; GitHub Issues is the tracker. Ask the human before
the repo is made or anything is pushed or filed. Then, from the repo root with `origin` set:

1. `gh auth status` - signed in. `gh issue close --help` - read the flags, do not guess them.
2. `node .agents/skills/triage/file-gh.mjs --dry` - read the gh calls it would make.
3. `node .agents/skills/triage/file-gh.mjs` - creates labels, files every issue as `<key> · <title>`
   with `key:`, `sources:`, `blocked-by:`, `duplicate-of:` lines in the body, then closes:
   done -> `--reason completed`; duplicate -> `--duplicate-of <url>`; not-planned, obsolete,
   contradicts-spec -> `--reason "not planned"` plus a `reason:<reason>` label for the last two.
   It writes `.sched/gh.json`, so a re-run, or `collectors/all.mjs --sink gh`, skips what is filed.
4. New requests later: `node collectors/all.mjs ... --sink gh` files them raw; triage each on GitHub
   (`gh issue edit --add-label`, `gh issue close`) by the same rules.
5. Check: `gh issue list --state all --limit 500 --json number,title,state,stateReason,labels,body` -
   every open issue has exactly one of agent-ready / needs-human. That output is the hand-in.

Keep `.sched/` out of git: its cursor file holds the session token.
