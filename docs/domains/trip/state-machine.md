# Trip State Machine

## Purpose

Defines valid state transitions.

---

Draft

↓

Planning

↓

Ready

↓

Traveling

↓

Completed

↓

Archived

---

# Allowed Transitions

Draft

→ Planning

Planning

→ Ready

Planning

→ Draft

Ready

→ Planning

Ready

→ Traveling

Traveling

→ Completed

Completed

→ Archived

---

# Forbidden Transitions

Draft

✗ Traveling

Draft

✗ Completed

Planning

✗ Archived

Ready

✗ Archived

Traveling

✗ Draft

Completed

✗ Planning

Archived

✗ Traveling

Archived

✗ Ready

---

# State Events

Every transition generates an event.

Example

Planning

↓

Ready

↓

TripReadyEvent

These events may later trigger:

Notifications

Synchronization

AI

Statistics

Audit Log

---

# Validation

Invalid transitions MUST be rejected.

The current state MUST remain unchanged.

---

# Future

Future versions may introduce

Cancelled

Paused

Delayed

states.