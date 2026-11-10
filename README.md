# sched-prod · tracker kit

sched-prod is a scheduling product: booking pages, calendars, reminders, exports.
Requests for it arrive from support, clients, product, analytics and finance.
This kit fills its issue tracker — as Markdown files here, or as GitHub Issues.

## Fill the tracker

You need Node 18 or newer. `start-challenge` gives you the API address and your session token.

```
node collectors/all.mjs --api <api url> --session <session token>              # Markdown files in doc/issues/
node collectors/all.mjs --api <api url> --session <session token> --sink gh    # GitHub Issues in this repo (gh CLI, signed in)
```

`all.mjs` runs `backlog.mjs` and one collector per channel: `desk.mjs` (support tickets), `chat.mjs`
(the team chat), `mail.mjs` (client email). Each runs on its own too, with the same options.
A channel collector picks up where it left off (the cursor is kept in `.sched/`); an issue it has
already filed is left alone.

The API, if you want to read it yourself (every call takes `?t=<session token>`):

- `GET <api url>/backlog` — the backlog: `{ issues: [{ key, title, status, labels, body }] }`
- `GET <api url>/channels/<channel>` — `{ channel, items: [{ id, from, text, reporter? }], cursor }`.
  Pass `since=<cursor>` to get what arrived after that page.

## The issue format

Every issue carries these fields. As Markdown, they are the frontmatter; on GitHub, see below.

```
---
key: SCHED-4412            # backlog issues keep their SCHED key; a new issue takes any key you like
title: "short title"
status: open               # open · done · closed
reason: duplicate          # closed only: duplicate · obsolete · contradicts-spec · not-planned
labels: [agent-ready, from:support]   # agent-ready or needs-human, plus where it came from
sources: [IN-1234, IN-5678]           # the requests (intents, IN-…) this issue answers
blocked-by: [SCHED-4412]   # issues that must be done first (a key, a file name, or #n on GitHub)
duplicate-of: SCHED-4446   # closed as duplicate: the issue it duplicates
---

What the issue is about. A closed issue says what decided it: the spec id, issue key or
request id it rests on.
```

- Every request belongs in the `sources` of some issue — open, done or closed.
- `done` is for work that shipped. A request that needs no work is `closed` with a reason.
- Every open issue carries one of the two marks: `agent-ready` (an agent picks it up and ships it
  on its own) or `needs-human` (it waits for a person to decide).

### Issue bodies

An `agent-ready` issue is a brief an agent can work from without asking:

```
## Intent
What changes, in a sentence or two.

## Acceptance
- Given …, when …, then …        (lines a reader can check: Given / When / Then, or - [ ] checks)
- Given …, when …, then … not …  (at least one case of what must not happen)

## Boundaries
- Must not touch …

Allowed by <the line in specs/autonomy.md that lets an agent do it alone, by its id>.
```

A `needs-human` issue is a question a person can answer:

```
## Question
What has to be decided?

## Options
1. …
2. …                             (two or more)

## Recommendation
Option …

## Why
Because … (the fact it rests on, by its id).
```

A closed issue, and a `needs-human` one, cite what decided it: a rule's id from `specs/`, an issue
key or a request id.

### On GitHub

- `key`, `sources`, `blocked-by` and `duplicate-of` are lines in the issue body, as above (`key: SCHED-4412`).
  A backlog issue may carry its key as the title prefix instead (`SCHED-4412 · …`).
- `status` and `reason` come from the issue: open, or closed as completed (= done), not planned or duplicate.
  `obsolete` and `contradicts-spec` are labels: `reason:obsolete`, `reason:contradicts-spec`.
- GitHub's own "blocked by" relationship counts too (gh 2.94 or newer).
- The course's `check-lane { "need": "gh" }` checks your gh is ready.
- To hand the tracker in: `gh issue list --state all --limit 500 --json number,title,state,stateReason,labels,body`
  (add `blockedBy` to the fields if you use GitHub's relationship).

## Another tracker

Keep the issues in Linear, Asana or anything else if you like. Before you hand the tracker in,
export it into the Markdown format above.
