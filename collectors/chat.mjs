#!/usr/bin/env node
// The `chat` channel (the team chat) → the tracker: every new request becomes a new open issue.
//
//   node collectors/chat.mjs --api <api url> --session <session token> [--sink md|gh]
import { file, options, pollChannel, requestIssue, run } from './lib.mjs';

run(async () => {
  const opts = options();
  const items = await pollChannel(opts, 'chat');
  let n = 0;
  for (const item of items) if (file(opts, requestIssue(item, 'chat'))) n++;
  console.log(`chat: ${n} new issue(s)`);
});
