#!/usr/bin/env node
// The `desk` channel (the support desk's tickets) → the tracker: every new request becomes a new open issue.
//
//   node collectors/desk.mjs --api <api url> --session <session token> [--sink md|gh]
import { file, options, pollChannel, requestIssue, run } from './lib.mjs';

run(async () => {
  const opts = options();
  const items = await pollChannel(opts, 'desk');
  let n = 0;
  for (const item of items) if (file(opts, requestIssue(item, 'desk'))) n++;
  console.log(`desk: ${n} new issue(s)`);
});
