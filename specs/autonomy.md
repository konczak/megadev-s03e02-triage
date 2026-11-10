# sched-prod · what an agent may do alone

Issues marked `agent-ready` are picked up by an agent and shipped without a person in the loop.
Issues marked `needs-human` wait for a person to decide. Every rule has an id; cite it by that id.

## AUT-1 · an agent may do alone
- copy changes in the product's own interface
- bug fixes and small features inside the specs, with a test that shows the change
- bringing code in line with a rule in `specs/` when nothing visible changes
- new columns, filters or fields that add to what is there and take nothing away
- a new colour scheme built as a token set from the existing palette (DES-2)
- a larger text setting built on the type scale (DES-1)
- a denser layout built on the spacing scale (DES-3)

## AUT-2 · needs a human
- a change to something a client has told us they rely on
- anything that touches pricing, invoices or the client terms
- deleting or rewriting data that is already stored

## AUT-3 · how a needs-human issue reads
A question a person can answer: what has to be decided, two or more options, which one you
recommend, and why.
