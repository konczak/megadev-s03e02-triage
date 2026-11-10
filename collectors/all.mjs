#!/usr/bin/env node
// Everything at once: the backlog, then every channel.
//
//   node collectors/all.mjs --api <api url> --session <session token> [--sink md|gh]
import { backlogIssue, CHANNELS, file, get, options, pollChannel, requestIssue, run } from './lib.mjs';

run(async () => {
  const opts = options();
  const { issues } = await get(opts, '/backlog');
  let n = 0;
  for (const b of issues) if (file(opts, backlogIssue(b))) n++;
  console.log(`backlog: ${n} new issue(s)`);
  for (const channel of CHANNELS) {
    const items = await pollChannel(opts, channel);
    let k = 0;
    for (const item of items) if (file(opts, requestIssue(item, channel))) k++;
    console.log(`${channel}: ${k} new issue(s)`);
  }
});
