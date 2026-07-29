# Trip Definition

## Document Information

| Property | Value |
|----------|-------|
| Domain | Trip |
| Version | 0.1.0 |
| Status | Approved |

---

# Purpose

The Trip domain represents a single travel experience.

It is the central business object of Travel Companion and acts as the primary context for the application.

Every active workflow inside the application is performed within the context of one Trip.

---

# Definition

A Trip is a time-bounded container that references all information related to one journey.

A Trip does not own reusable objects.

Instead, it maintains references to independent domains.

---

# Responsibilities

The Trip domain is responsible for:

- travel identity
- travel lifecycle
- travel status
- travel readiness
- active context
- relationships between domains

The Trip domain is not responsible for:

- location management
- expense calculations
- document storage
- equipment management
- knowledge management

These responsibilities belong to their respective domains.

---

# Business Rules

A Trip:

- must have a unique identifier
- must have a name
- must have a start date
- must have an end date
- must have a state

Only one Trip may be Active at any given moment.

Trips reference global objects whenever possible.

---

# Design Principles

Trip is a container.

Trip is not a database.

Trip is not a folder.

Trip is a business object.

---

# Examples

California 2026

Japan 2028

Weekend in Vienna

Business Trip Berlin

BlizzCon 2026

---

# Related Domains

Timeline

Location

Document

Expense

Equipment

Knowledge