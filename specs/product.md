# sched-prod · product

sched-prod lets studios, clinics and agencies take bookings: a public booking page, the team's
calendars, reminders and confirmations by email, and exports for the client's own tools.
About 300 000 people use it each week.

## Primitives

- **Account** — one client (a studio, a clinic). Has a locale and a time zone.
- **Slot** — a time someone can book. Has a start, an end and a number of seats.
- **Booking** — one person in one slot.
- **Channel** — where a booking came from: the booking link, the embedded widget, or the API.

## Invariants

Every rule has an id; cite it by that id.

### PRD-1 · one booking, one slot
A booking belongs to exactly one slot. Moving a booking means a new booking and a cancelled one.

### PRD-2 · time is UTC inside
Times are stored in UTC and shown in the viewer's zone. See decisions/0001-store-utc.md.

### PRD-3 · the client's data is theirs
Every export carries all of a client's booking data. An export never loses a column it had.

### PRD-4 · one place to change a rule
A rule the product follows lives in one place: a spec here, a token, or a setting. Not in a component.
