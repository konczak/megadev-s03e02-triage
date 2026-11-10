# ADR-0002 · calendar sync is one-way

Status: accepted

## Context
Two-way sync with external calendars made every edit a conflict to resolve.

## Decision
sched-prod pushes bookings to connected calendars. It never reads events back from them.

## Consequences
A booking changed in an external calendar is not changed in sched-prod. Each booking is pushed
once, with a stable id, so a calendar can tell an update from a new event.
