#!/usr/bin/env node
// The `mail` channel (client and partner email) → the tracker: every new request becomes a new open issue.
//
//   node collectors/mail.mjs --api <api url> --session <session token> [--sink md|gh]
import { file, options, pollChannel, requestIssue, run } from './lib.mjs';

run(async () => {
  const opts = options();
  const items = await pollChannel(opts, 'mail');
  let n = 0;
  for (const item of items) if (file(opts, requestIssue(item, 'mail'))) n++;
  console.log(`mail: ${n} new issue(s)`);
});
