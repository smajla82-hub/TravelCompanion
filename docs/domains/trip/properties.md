# Trip Properties

## Purpose

This document defines the business properties of the Trip domain.

Properties describe business meaning rather than database implementation.

---

# Required Properties

| Property | Required | Description |
|----------|----------|-------------|
| UUID | Yes | Unique identifier |
| Name | Yes | User-defined trip name |
| Status | Yes | Current lifecycle state |
| Start Date | Yes | Beginning of the trip |
| End Date | Yes | End of the trip |
| Primary Destination | Yes | Main destination |
| Currency | Yes | Default trip currency |
| Time Zone | Yes | Primary trip time zone |

---

# Optional Properties

| Property | Description |
|----------|-------------|
| Description | Additional notes |
| Cover Image | Trip image |
| Theme Color | UI personalization |
| Icon | Visual representation |
| Default Language | Preferred language |

---

# Computed Properties

The following properties are calculated automatically.

- Days Remaining
- Trip Duration
- Trip Score
- Total Expenses
- Number of Events
- Number of Documents
- Number of Locations
- Number of Countries

Computed properties MUST NOT be edited manually.

---

# Metadata

Every Trip automatically contains:

- Created Date
- Modified Date
- Version
- Archived
- Favorite

---

# Validation

Trip Name MUST NOT be empty.

Start Date MUST exist.

End Date MUST exist.

End Date MUST NOT be earlier than Start Date.

Currency MUST use ISO-4217.

Time Zone SHOULD use IANA Time Zone identifiers.

---

# Future Extensions

Future versions may include:

- Multiple currencies
- Multiple time zones
- Shared ownership
- Trip labels