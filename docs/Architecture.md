# UltraFlow Architecture Decisions (AD)

**Project:** UltraFlow  
**Version:** 1.0  
**Status:** Active  
**Purpose:** This document records all significant architectural and design decisions made during the development of UltraFlow. Each decision includes the reasoning behind it to ensure consistency and provide historical context for future development.

---

## AD-001 — Project Documentation Strategy

**Status:** Accepted

### Decision

UltraFlow shall maintain comprehensive project documentation using Markdown (`.md`) files stored within the `/docs` directory.

### Reason

- Keeps architectural knowledge separate from source code.
- Allows AI assistants and developers to quickly understand the project.
- Provides a permanent record of design decisions.
- Simplifies onboarding of future contributors.

---

## AD-002 — Hierarchical Project Structure

**Status:** Accepted

### Decision

Every construction project shall follow the hierarchy below:

```text
Organization
    ↓
Project
    ↓
Building
    ↓
Floor
    ↓
Wing
    ↓
Space
```

### Reason

This mirrors the physical structure of construction projects while allowing future expansion to multiple organizations and projects.

---

## AD-003 — "Room" Renamed to "Space"

**Status:** Accepted

### Decision

The entity previously referred to as **Room** shall be renamed to **Space**.

### Reason

Construction activities are not limited to rooms.

A Space may represent:

- Bedroom
- Bathroom
- Corridor
- Lobby
- Staircase
- Roof
- Balcony
- Plant Room
- Electrical Room
- Lift Lobby
- External Area
- Store

Using **Space** makes the system flexible enough to represent every physical work location.

---

## AD-004 — Space-Centric System Design

**Status:** Accepted

### Decision

UltraFlow shall be centered around **Spaces** rather than Projects or Floors.

### Reason

Every construction activity ultimately occurs within a Space.

Each Space becomes a digital twin containing:

- Progress
- Assessments
- Photos
- Reports
- Issues
- Timeline
- Drawings
- AI Summary
- History

Projects, Buildings, Floors and Wings primarily exist to organize and locate Spaces.

---

## AD-005 — Construction Phases

**Status:** Accepted

### Decision

Construction activities shall be grouped into configurable Construction Phases.

Example:

- First Fix
- Second Fix
- Testing & Commissioning
- Snagging
- Handover

### Reason

Construction naturally progresses in phases.

Grouping activities this way improves:

- Progress tracking
- Reporting
- Analytics
- AI summaries

Different project types may define different phase templates.

---

## AD-006 — Activity Templates

**Status:** Accepted

### Decision

Activities shall not be hardcoded.

Instead, they shall be created from reusable Activity Templates.

Example:

First Fix

- Chasing
- Routing
- Dropping
- Boxing
- CU Installation

Second Fix

- Wiring
- Socket Installation
- Switch Installation
- Lighting Installation

### Reason

Allows UltraFlow to support different disciplines such as:

- Electrical
- Civil
- HVAC
- Plumbing
- Fire Protection

without changing the application.

---

## AD-007 — Progress Records

**Status:** Accepted

### Decision

Every activity update shall generate a Progress Record rather than overwrite previous information.

### Reason

Maintains complete historical records.

Benefits include:

- Audit trail
- Progress history
- AI analysis
- Timeline generation
- Accountability

---

## AD-008 — Role-Based Access Control (RBAC)

**Status:** Accepted

### Decision

UltraFlow shall implement Role-Based Access Control (RBAC).

Users receive Roles.

Roles contain Permissions.

Permissions determine what users can access or modify.

### Reason

Roles can be created or modified without changing application code.

This makes the system scalable and suitable for future organizations.

---

## AD-009 — Permission-Based Design

**Status:** Accepted

### Decision

Permissions shall follow the format:

```text
Module.Action
```

Examples:

- Space.View
- Space.Edit
- Progress.Create
- Assessment.Approve
- Report.Generate
- Analytics.View

### Reason

Provides a clean, scalable and industry-standard permission structure.

---

## AD-010 — Scope-Based Permissions

**Status:** Accepted

### Decision

Permissions may be restricted by project scope.

Example:

An electrician may only have access to:

Project → Building → Floor → Wing

assigned to them.

### Reason

Improves security while reducing unnecessary information shown to users.

---

## AD-011 — AI Integration

**Status:** Accepted

### Decision

Artificial Intelligence shall be integrated throughout the system rather than exist as a standalone module.

Examples include:

- Grammar enhancement
- Report generation
- Progress summaries
- Executive summaries
- Natural language search
- Future predictive analytics

### Reason

AI should enhance existing workflows rather than introduce separate ones.

---

## AD-012 — Interactive Floor Plans

**Status:** Accepted

### Decision

Floor plans shall be interactive.

Selecting a Space on the floor plan opens the corresponding Space Workspace.

### Reason

Provides intuitive navigation and visual project monitoring.

---

## AD-013 — Documentation-First Development

**Status:** Accepted

### Decision

UltraFlow development shall follow a documentation-first approach.

Order of development:

1. Documentation
2. Architecture
3. Database Design
4. UI Design
5. Frontend Development
6. Backend Development
7. AI Integration
8. Testing
9. Deployment

### Reason

Good architecture reduces rework and improves long-term maintainability.

---

## Change Log

| Date | Decision | Author |
|------|----------|--------|
| 05 Aug 2026 | Initial Architecture Decisions created | Crispus Rotich |
