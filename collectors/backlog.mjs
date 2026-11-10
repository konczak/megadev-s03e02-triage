#!/usr/bin/env node
// The product's backlog → the tracker, as it is.
//
//   node collectors/backlog.mjs --api <api url> --session <session token> [--sink md|gh]
import { backlogIssue, file, get, options, run } from './lib.mjs';

run(async () => {
  const opts = options();
  const { issues } = await get(opts, '/backlog');
  let n = 0;
  for (const b of issues) if (file(opts, backlogIssue(b))) n++;
  console.log(`backlog: ${n} new issue(s)`);
});
