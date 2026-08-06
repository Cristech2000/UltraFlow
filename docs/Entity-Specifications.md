# UltraFlow Entity Specifications

**Project:** UltraFlow  
**Version:** 1.0  
**Status:** Draft

---

# Purpose

This document defines every major entity within the UltraFlow ecosystem.

Each entity represents a real-world object or concept used throughout construction project management.

The purpose of these specifications is to provide a consistent reference for software development, database implementation, reporting, AI integration, and future expansion.

---

# 1. Organization

## Description

Represents a company or organization using UltraFlow.

## Responsibilities

- Owns Projects
- Manages Users
- Defines company settings
- Controls permissions

## Fields

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| organizationId | String | Yes | Unique identifier |
| name | String | Yes | Organization name |
| abbreviation | String | No | Short name |
| address | String | No | Physical address |
| email | String | No | Contact email |
| phone | String | No | Contact phone |
| createdAt | Timestamp | Yes | Creation date |
| updatedAt | Timestamp | Yes | Last modification |

---

# 2. Project

## Description

Represents one construction project.

Examples

- Qwetu Qejani
- Casa Pasha

## Responsibilities

- Contains Buildings
- Stores project information
- Stores project drawings
- Tracks overall progress
- Generates reports

## Fields

| Field | Type |
|--------|------|
| projectId | String |
| organizationId | String |
| projectName | String |
| projectCode | String |
| client | String |
| consultant | String |
| contractor | String |
| location | String |
| startDate | Date |
| expectedCompletion | Date |
| projectStatus | String |
| createdAt | Timestamp |
| updatedAt | Timestamp |

---

# 3. Building

## Description

Represents one building inside a project.

Examples

- Block A
- Block B
- Block C

## Responsibilities

- Contains Floors
- Organizes project progress

## Fields

| Field | Type |
|--------|------|
| buildingId | String |
| projectId | String |
| buildingName | String |
| description | String |
| createdAt | Timestamp |

---

# 4. Floor

## Description

Represents one floor within a building.

## Responsibilities

- Contains Wings
- Organizes Spaces

## Fields

| Field | Type |
|--------|------|
| floorId | String |
| buildingId | String |
| floorNumber | Integer |
| floorName | String |
| createdAt | Timestamp |

---

# 5. Wing

## Description

Represents one subdivision of a floor.

Examples

- Wing A
- Wing B
- Wing C

## Responsibilities

- Contains Spaces

## Fields

| Field | Type |
|--------|------|
| wingId | String |
| floorId | String |
| wingName | String |
| createdAt | Timestamp |

---

# 6. Space

## Description

A Space represents any identifiable physical work location.

Unlike traditional construction systems that focus only on rooms, UltraFlow models every work location as a Space.

Examples

- Bedroom
- Bathroom
- Corridor
- Roof
- Lift Lobby
- Balcony
- Plant Room
- Electrical Room
- External Area

Each Space acts as the digital twin of its physical counterpart.

## Responsibilities

- Track progress
- Store construction phases
- Manage activities
- Store photos
- Store reports
- Store assessments
- Store drawings
- Store issues
- Maintain timeline
- Generate AI summaries
- Preserve history

## Fields

| Field | Type |
|--------|------|
| spaceId | String |
| projectId | String |
| buildingId | String |
| floorId | String |
| wingId | String |
| spaceName | String |
| spaceType | String |
| status | String |
| completionPercentage | Number |
| createdAt | Timestamp |
| updatedAt | Timestamp |

## Components

Every Space contains:

- Construction Phases
- Activities
- Progress Records
- Assessments
- Issues
- Photos
- Reports
- Drawings
- Timeline
- AI Summary
- History

---

# 7. Construction Phase

## Description

Groups activities into logical construction stages.

Examples

- First Fix
- Second Fix
- Testing & Commissioning
- Snagging
- Handover

## Fields

| Field | Type |
|--------|------|
| phaseId | String |
| spaceId | String |
| phaseName | String |
| sequence | Integer |
| status | String |

---

# 8. Activity Template

## Description

Defines reusable activities.

Examples

First Fix

- Chasing
- Routing
- Dropping
- Boxing

Second Fix

- Wiring
- Socket Installation
- Switch Installation

## Fields

| Field | Type |
|--------|------|
| templateId | String |
| discipline | String |
| activityName | String |
| phase | String |
| defaultOrder | Integer |

---

# 9. Activity

## Description

Represents one construction task inside a Space.

## Fields

| Field | Type |
|--------|------|
| activityId | String |
| phaseId | String |
| templateId | String |
| activityName | String |
| status | String |
| completionPercentage | Number |

---

# 10. Progress Record

## Description

Represents one progress update.

Progress Records are immutable.

Every update creates a new record.

## Fields

| Field | Type |
|--------|------|
| progressId | String |
| activityId | String |
| updatedBy | String |
| remarks | String |
| completion | Number |
| timestamp | Timestamp |

---

# 11. Assessment

## Description

Records workmanship inspections and observations.

## Fields

| Field | Type |
|--------|------|
| assessmentId | String |
| spaceId | String |
| assessor | String |
| assessmentDate | Timestamp |
| remarks | String |
| recommendation | String |

---

# 12. Issue

## Description

Represents defects or observations.

Examples

- Blocked conduit
- Incorrect routing
- Missing socket
- Failed inspection

## Fields

| Field | Type |
|--------|------|
| issueId | String |
| spaceId | String |
| severity | String |
| description | String |
| status | String |
| assignedTo | String |

---

# 13. Photo

## Description

Stores references to photographs uploaded to Google Drive.

## Fields

| Field | Type |
|--------|------|
| photoId | String |
| spaceId | String |
| driveFileId | String |
| folderId | String |
| uploadedBy | String |
| uploadedAt | Timestamp |
| caption | String |

---

# 14. Drawing

## Description

Represents construction drawings linked from Google Drive.

## Fields

| Field | Type |
|--------|------|
| drawingId | String |
| projectId | String |
| drawingType | String |
| driveFileId | String |
| revision | String |

---

# 15. Report

## Description

Represents generated project reports.

Reports are generated from existing project data.

## Fields

| Field | Type |
|--------|------|
| reportId | String |
| projectId | String |
| reportType | String |
| generatedBy | String |
| generatedAt | Timestamp |
| driveFileId | String |

---

# 16. Timeline Event

## Description

Represents one chronological project event.

Examples

- Progress updated
- Assessment completed
- Photo uploaded
- Report generated

## Fields

| Field | Type |
|--------|------|
| eventId | String |
| spaceId | String |
| eventType | String |
| description | String |
| userId | String |
| timestamp | Timestamp |

---

# 17. User

## Description

Represents one authenticated system user.

## Fields

| Field | Type |
|--------|------|
| userId | String |
| fullName | String |
| email | String |
| phone | String |
| roleId | String |
| accountStatus | String |

---

# 18. Role

## Description

Defines a collection of permissions.

Examples

- Documentation Assistant
- Engineer
- Electrician
- Foreman
- Supervisor
- HR
- Director

## Fields

| Field | Type |
|--------|------|
| roleId | String |
| roleName | String |
| description | String |

---

# 19. Permission

## Description

Represents one system permission.

Examples

- Space.View
- Progress.Create
- Assessment.Approve
- Report.Generate

## Fields

| Field | Type |
|--------|------|
| permissionId | String |
| module | String |
| action | String |

---

# 20. Notification

## Description

Represents system-generated notifications.

## Fields

| Field | Type |
|--------|------|
| notificationId | String |
| recipientId | String |
| title | String |
| message | String |
| read | Boolean |
| createdAt | Timestamp |

---

# 21. Audit Log

## Description

Records important system activities for accountability.

Examples

- User Login
- Progress Updated
- Report Generated
- Assessment Approved

## Fields

| Field | Type |
|--------|------|
| auditId | String |
| userId | String |
| action | String |
| description | String |
| timestamp | Timestamp |

---

# Entity Design Principles

Every entity in UltraFlow follows the principles below:

- Represents one real-world business object.
- Contains a unique identifier.
- Maintains creation and modification timestamps.
- Uses reference IDs rather than nested structures.
- Supports future scalability.
- Maintains historical traceability.
