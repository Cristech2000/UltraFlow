# UltraFlow Database Design

**Project:** UltraFlow  
**Version:** 1.0  
**Status:** Draft

---

# Purpose

This document defines the database architecture of UltraFlow.

It describes how project data is structured, stored, related, secured and managed throughout the system.

The database design follows the Domain Model and Architecture Decisions established for UltraFlow.

---

# Database Philosophy

UltraFlow adopts a document-oriented database architecture using **Firebase Firestore**.

Rather than modelling tables and relationships like a traditional SQL database, the system models real-world construction entities as independent documents connected through reference IDs.

The database has been designed around the following principles:

- Simplicity
- Scalability
- Read Performance
- Maintainability
- Offline Capability
- AI Readiness

Each document represents one meaningful business entity.

Historical information is never overwritten.

All major project events remain permanently traceable.

---

# Technology Stack

| Component | Technology |
|-----------|------------|
| Database | Firebase Firestore |
| Authentication | Firebase Authentication |
| File Storage | Google Drive |
| Hosting | GitHub Pages |
| AI | OpenAI API (Future) |

---

# Collection Relationship Map

```text
                                    ORGANIZATION
                                          │
                                          ▼
                                      PROJECTS
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
        BUILDINGS                    PROJECT FILES                  USERS
            │                        (Drive Links)                    │
            ▼                                                      Roles
         FLOORS                                                      │
            ▼                                                   Permissions
          WINGS
            ▼
          SPACES
            │
 ┌──────────┼───────────┬────────────┬────────────┬────────────┬────────────┐
 ▼          ▼           ▼            ▼            ▼            ▼            ▼
Phases   Assessments  Issues      Reports      Timeline     Photos      Drawings
 │                                                          │
 ▼                                                          ▼
Activities                                             Google Drive
 │
 ▼
Progress Records
```

---

# Collection Overview

UltraFlow shall use flat Firestore collections connected through reference IDs.

## Core Collections

- organizations
- projects
- buildings
- floors
- wings
- spaces

---

## Work Management

- constructionPhases
- activityTemplates
- activities
- progressRecords

---

## Documentation

- assessments
- reports
- issues
- drawings
- photos

---

## User Management

- users
- roles
- permissions

---

## System Collections

- notifications
- auditLogs
- templates
- settings

---

# Collection Relationships

Every collection remains independent.

Relationships are maintained through document reference IDs.

Example

```text
Project
   │
projectId
   │
Building
   │
buildingId
   │
Floor
   │
floorId
   │
Wing
   │
wingId
   │
Space
```

The database shall avoid deeply nested collections.

---

# Reference Strategy

UltraFlow uses document references rather than embedded objects.

Example

```json
{
  "spaceId":"space001",
  "buildingId":"buildingA",
  "floorId":"floor03",
  "wingId":"wingB"
}
```

Benefits include:

- Faster querying
- Easier reporting
- Better scalability
- Simpler security rules
- Cleaner analytics

---

# File Storage Strategy

Structured project information shall be stored in Firebase Firestore.

Large binary files shall be stored separately in Google Drive.

Firestore stores only file metadata and references.

Examples include:

- Photos
- Drawings
- Reports
- Method Statements
- Inspection Sheets
- Certificates

Each uploaded file stores:

- File Name
- Google Drive File ID
- Google Drive Folder ID
- Uploaded By
- Upload Date
- Related Space
- Related Activity
- File Type

---

# Google Drive Folder Structure

```text
UltraFlow

│

├── Project Name

│      ├── Building

│      │      ├── Floor

│      │      │      ├── Wing

│      │      │      │      ├── Space

│      │      │      │      │      ├── Photos

│      │      │      │      │      ├── Reports

│      │      │      │      │      ├── Drawings

│      │      │      │      │      └── Assessments
```

This hierarchy mirrors the physical construction project, making files easy to locate both inside and outside UltraFlow.

---

# Naming Convention

Collections shall use:

- lowercase
- plural names
- camelCase for document fields

Examples

Collections

- projects
- spaces
- progressRecords

Fields

- projectId
- buildingId
- completionPercentage
- createdAt
- updatedBy

---

# Progress Records

Progress Records are immutable.

Each update creates a new record.

Progress Records are never edited or deleted.

This provides:

- Audit trail
- Historical reporting
- AI analysis
- Timeline generation
- Accountability

---

# Audit Logging

All major system events shall be recorded.

Examples include:

- Login
- Report Generated
- Assessment Approved
- Progress Updated
- Photo Uploaded
- Issue Closed

Audit logs provide traceability and accountability.

---

# Security Strategy

Security shall be enforced through Firebase Authentication and Firestore Security Rules.

Access is controlled through:

- Authentication
- Roles
- Permissions
- Scope

Permissions determine:

- View
- Create
- Edit
- Delete
- Approve

Scopes determine:

- Organization
- Project
- Building
- Floor
- Wing
- Space

---

# Offline Strategy

UltraFlow shall support Firestore offline persistence.

When internet connectivity is unavailable:

- Data is cached locally.
- Users continue working.
- Changes synchronize automatically once connectivity is restored.

---

# Scalability

The database has been designed to support:

- Multiple Organizations
- Multiple Projects
- Multiple Buildings
- Unlimited Floors
- Unlimited Wings
- Unlimited Spaces
- Multiple Construction Disciplines

The architecture allows future expansion without requiring structural redesign.

---

# AI Readiness

The database structure has been designed to support future AI functionality.

AI may utilize:

- Progress Records
- Assessments
- Reports
- Timeline Events
- Photos
- Issues

to generate:

- Progress Summaries
- Executive Reports
- Risk Analysis
- Predictive Analytics
- Construction Insights

No database restructuring should be required when AI capabilities are introduced.

---

# Future Expansion

The database architecture has been prepared for future modules including:

- Inventory Management
- Material Tracking
- Labour Tracking
- Attendance
- Cost Management
- Equipment Management
- Quality Assurance
- Safety Management
- Client Portal
- QR Code Navigation
