# Domain Model

# Document Information

| Property | Value |
|----------|-------|
| Version | 0.1.0 |
| Status | Approved |

---

# Core Domains

Travel Companion consists of independent business domains.

---

## Trip

Represents one complete journey.

---

## Timeline

Represents chronological events.

---

## Location

Global reusable locations.

Examples:

- Hotel
- Airport
- Museum
- Restaurant
- Parking

---

## Equipment

Personal travel equipment.

Reusable between trips.

---

## Document

Travel related files.

Examples:

- Boarding Pass
- Passport
- Insurance
- Tickets
- Reservations

---

## Expense

Financial transactions.

Categories determine behaviour.

---

## Knowledge

Personal travel knowledge.

Reusable across all trips.

---

# Domain Relationships

Trip

↓

Timeline

↓

Location

↓

Expense

↓

Document

Every domain remains independent.

Communication happens through references.

---

# Shared Principles

Every domain follows the same rules.

Every object has:

- UUID
- Created
- Modified
- Status
- Notes
- Attachments
- Tags
- History

---

# Future Domains

Version 2

- AI Assistant
- Collaboration
- Synchronization
- Notifications