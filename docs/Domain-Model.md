# Core Principles

UltraFlow is built around three fundamental concepts.

## 1. Location

Represents where work takes place.

Hierarchy:

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

---

## 2. Work

Represents the construction work being performed.

Hierarchy:

Construction Phase

↓

Activity

↓

Progress Record

---

## 3. Evidence

Represents proof that work has been performed.

Evidence includes:

- Photos
- Assessments
- Reports
- Issues
- Timeline Events
- AI Summaries
- Drawings

# Core Principles

UltraFlow is built around three fundamental concepts.

## 1. Location

Represents where work takes place.

Hierarchy:

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

---

## 2. Work

Represents the construction work being performed.

Hierarchy:

Construction Phase

↓

Activity

↓

Progress Record

---

## 3. Evidence

Represents proof that work has been performed.

Evidence includes:

- Photos
- Assessments
- Reports
- Issues
- Timeline Events
- AI Summaries
- Drawings

# System Hierarchy

UltraFlow models construction projects using the following hierarchy.

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

Each entity exists to organize and locate Spaces, which represent the actual physical work locations within a project.

## Organization

### Description

Represents a company or organization using UltraFlow.

Examples include:

- Ultra Power Systems
- Future Contractors
- Client Organizations

### Responsibilities

- Owns projects.
- Manages users.
- Defines system-wide settings.
- Controls project templates.
## Project

### Description

Represents an individual construction project undertaken by an organization.

Examples include:

- Qwetu Qejani
- Qwetu Hurlingham
- Casa Pasha

### Responsibilities

- Contains buildings.
- Stores project drawings.
- Stores project documents.
- Generates project reports.
- Tracks overall project progress.
- Maintains project timeline.

## Building

### Description

Represents an individual building within a construction project.

Examples include:

- Block A
- Block B
- Block C

### Responsibilities

- Contains floors.
- Groups construction progress by building.

## Floor

### Description

Represents a physical floor within a building.

Examples include:

- Ground Floor
- Level 1
- Level 15

### Responsibilities

- Contains wings.
- Organizes spaces by elevation.

## Wing

### Description

Represents a subdivision of a floor.

Examples include:

- Wing A
- Wing B
- Wing C

### Responsibilities

- Contains spaces.
- Simplifies navigation within large floors.


## Space

### Description

A Space represents any identifiable physical work location within a construction project.

Unlike traditional construction management systems that focus solely on rooms, UltraFlow models every physical work location as a Space. This provides the flexibility to document and monitor progress in any area where construction activities occur.

Examples include:

- Bedroom
- Bathroom
- Kitchen
- Living Room
- Corridor
- Staircase
- Lift Lobby
- Balcony
- Roof
- Plant Room
- Electrical Room
- Store
- External Area

Each Space acts as a **digital twin** of its physical counterpart by consolidating all information related to construction activities performed within that location.

---

### Responsibilities

A Space is responsible for:

- Tracking construction progress.
- Organizing construction phases.
- Managing activities.
- Recording progress history.
- Storing assessments.
- Managing issues and defects.
- Storing photographic evidence.
- Maintaining a chronological activity timeline.
- Generating reports.
- Linking relevant drawings.
- Providing AI-generated summaries.
- Preserving historical records throughout the project lifecycle.

---

### Identity

Every Space possesses a unique identity within the project hierarchy.

Each Space contains:

- Space Name
- Space Type
- Project
- Building
- Floor
- Wing
- Current Status
- Overall Completion Percentage

---

### Space Components

Every Space contains the following major components:

- Identity
- Construction Phases
- Activities
- Progress Records
- Assessments
- Issues
- Photos
- Timeline
- Reports
- Drawings
- AI Summary
- History

---

### Construction Phases

Construction work within a Space is organized into configurable Construction Phases.

Typical phases include:

- First Fix
- Second Fix
- Testing & Commissioning
- Snagging
- Handover

Each phase contains one or more Activities.

---

### Activities

Activities represent individual construction tasks performed within a Construction Phase.

Examples include:

**First Fix**

- Chasing
- Routing
- Dropping
- Boxing
- CU Installation

**Second Fix**

- Wiring
- Socket Installation
- Switch Installation
- Lighting Installation
- Fan Installation

**Testing & Commissioning**

- Continuity Testing
- Insulation Resistance Testing
- Polarity Testing
- Functional Testing

Activities are configurable through Activity Templates and may vary depending on project type.

---

### Progress Records

Every Activity update creates a Progress Record.

Progress Records are immutable and form the permanent audit trail of work performed within a Space.

Each Progress Record may contain:

- Activity
- Status
- Updated By
- Date and Time
- Remarks
- Attached Photos

---

### Assessments

Assessments record the condition and quality of work performed within a Space.

Assessment findings may generate Issues and corrective actions.

---

### Issues

Issues represent defects, observations, or non-conformities identified during construction.

Examples include:

- Blocked conduit
- Incorrect routing
- Damaged box
- Missing socket
- Failed inspection

Each Issue remains traceable until resolved.

---

### Photos

Photos provide visual evidence of construction activities.

Photos may be linked to:

- Activities
- Progress Records
- Assessments
- Issues

---

### Timeline

Every significant event occurring within a Space is automatically recorded on its Timeline.

Examples include:

- Activity completed
- Photo uploaded
- Assessment created
- Issue resolved
- Report generated

---

### Reports

Reports summarize work completed within a Space.

Reports are generated from existing project data and therefore do not own project information.

---

### Drawings

Spaces may reference architectural, electrical, mechanical, plumbing, or other project drawings relevant to that location.

---

### AI Summary

Each Space contains an AI-generated summary describing:

- Current progress
- Outstanding work
- Open issues
- Inspection status
- Recent activities

The AI Summary enables stakeholders to quickly understand the current state of a Space without reviewing detailed records.

---

### History

Every modification performed within a Space is permanently preserved.

The History component provides a complete chronological audit trail throughout the lifecycle of the project.
