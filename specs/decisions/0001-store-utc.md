# ADR-0001 · store times in UTC

Status: accepted

## Context
Accounts in many time zones book the same calendars. Times saved in local zones broke every
daylight-saving change.

## Decision
Every time is stored in UTC. The interface shows it in the viewer's zone. Anything that leaves the
product as data (exports, the API) says which zone a time is in.

## Consequences
Code converts at the edges only. A time without a zone is a bug.
