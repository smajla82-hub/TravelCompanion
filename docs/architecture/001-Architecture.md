# Travel Companion Architecture

# Document Information

| Property | Value |
|----------|-------|
| Document | Architecture |
| Version | 0.1.0 |
| Status | Approved |
| Last Updated | 2026-07-29 |

---

# Overview

Travel Companion is a modular, domain-oriented React + TypeScript PWA.

Every subsystem is separated into an independent domain with clearly defined responsibilities.

The architecture is intended to support long-term evolution without requiring major redesign.

---

# Architecture Principles

## Domain First

The application is built around business domains.

Examples:

- Trip
- Timeline
- Location
- Equipment
- Document
- Expense
- Knowledge

The user interface never owns business logic.

---

## Object Oriented Model

Everything inside the application is represented by objects.

Objects know their relationships.

Objects never duplicate information.

---

## Single Source of Truth

Every entity exists only once.

Example:

Location

↓

Hilton Anaheim

Referenced by:

- Timeline
- Budget
- Reviews
- Photos
- Notes

---

## Modular Design

Every domain can evolve independently.

Adding a new module must not require changes across the entire application.

---

## Context Driven

The application reacts to the user's current context.

Context is determined by:

- Current Trip
- Current Time
- Trip State
- Timeline
- Location (optional)
- User Activity

---

## Offline-Capable Client Operation

The current frontend operates client-side with browser `localStorage` persistence and remains usable offline after the PWA app shell is available.

---

## Platform Independence

Core logic must remain independent of the user interface.

Supported platforms:

- Web browsers, with Android/mobile as the current primary target

Future:

- macOS
- iOS

---

# Layers

Presentation Layer

↓

Application Layer

↓

Domain Layer

↓

Infrastructure Layer

↓

Browser persistence

---

# Current Persistence and Future Backend

Current persistence is browser `localStorage`; there is no current application database or server-side component.

Shared persistence, accounts and a backend database are future 10.x work. That evolution must preserve the domain layer rather than requiring its redesign.

---

# Import / Export

Supported formats:

- Excel
- XLSX RoadBook import
- JSON

Travel Companion remains the owner of all data.

External files are import/export mechanisms only.

---

# Security

User data belongs to the user.

Travel Companion never depends on cloud connectivity.

Offline access remains fully supported.

---

# Design Rules

Architecture decisions must satisfy:

- Simplicity
- Predictability
- Reusability
- Scalability
- Testability

---

# Architecture Goals

The architecture should remain valid for at least the next ten years.

New functionality should extend the system instead of replacing existing components.

---

# Status

Approved