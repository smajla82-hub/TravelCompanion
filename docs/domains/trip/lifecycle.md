# Trip Lifecycle

## Document Information

| Property | Value |
|----------|-------|
| Domain | Trip |
| Document | Lifecycle |
| Version | 0.1.0 |
| Status | Approved |

---

# Purpose

This document defines the lifecycle of a Trip object.

The lifecycle describes how a Trip evolves from creation to archival.

It does not describe implementation details.

---

# Lifecycle Overview

Every Trip progresses through a predefined lifecycle.

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

Transitions are controlled by business rules.

---

# Stage Definitions

## Draft

Purpose

Trip has been created but contains only basic information.

Typical characteristics

- Name exists
- Start Date exists
- End Date exists

No preparation has started.

---

## Planning

Purpose

The user actively prepares the journey.

Typical activities

- Flights
- Hotels
- Equipment
- Budget
- Timeline
- Documents

Most user interaction happens here.

---

## Ready

Purpose

Planning is finished.

The trip is considered ready for departure.

Minor edits remain possible.

---

## Traveling

Purpose

The journey is currently active.

Dashboard switches into Travel Mode.

Context Engine becomes active.

Notifications become travel-oriented.

---

## Completed

Purpose

The trip has ended.

Data becomes read-only by default.

Reviews and notes may still be added.

---

## Archived

Purpose

The trip is stored for historical purposes.

Archived trips never participate in Current Context.

They remain fully searchable.

---

# Lifecycle Rules

LR-001

Every Trip starts in Draft.

LR-002

A Trip MAY only move to the next valid lifecycle stage.

LR-003

Archived Trips MUST NOT become Active.

LR-004

Completed Trips MAY be archived.

LR-005

Planning data remains editable until Traveling.

---

# Business Goals

The lifecycle exists to:

- simplify application behaviour
- simplify dashboard decisions
- simplify notification logic
- simplify context awareness

---

# Related Documents

definition.md

properties.md

rules.md

state-machine.md