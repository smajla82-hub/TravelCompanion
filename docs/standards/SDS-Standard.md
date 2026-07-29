# Software Design Specification Standard

## Purpose

This document defines how Software Design Specifications are written within the Travel Companion project.

Every SDS document must follow this standard.

---

# Required Sections

Every SDS document should contain the following sections where applicable.

1. Purpose
2. Scope
3. Definitions
4. Responsibilities
5. Business Rules
6. Relationships
7. Validation Rules
8. User Scenarios
9. Future Extensions
10. Open Questions

---

# Writing Rules

Specifications describe behaviour.

Specifications never describe implementation.

Incorrect:

"The application will use SQLite."

Correct:

"The system stores trips locally."

---

Specifications are written in present tense.

Specifications use MUST, SHOULD and MAY.

Meaning:

MUST = mandatory

SHOULD = recommended

MAY = optional

---

Business Rules

Business rules are written as numbered rules.

Example:

BR-001

Only one Trip MAY be Active.

BR-002

Trip MUST contain Start Date.

BR-003

End Date MUST be greater than Start Date.

---

Examples

Examples should always be separated from business rules.

Examples never define behaviour.

Examples only illustrate behaviour.

---

Future Extensions

Ideas for future versions belong here.

They MUST NOT affect current implementation.

---

Status

Draft