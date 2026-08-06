# UltraFlow AI Context

**Project:** UltraFlow  
**Version:** 1.0

---

# Identity

UltraFlow is a desktop-first Construction Project Management and Digital Construction Intelligence Platform.

It is designed specifically for electrical installation projects but has been architected to support multiple construction disciplines in the future.

UltraFlow is NOT a generic project management application.

It models real construction workflows.

---

# Core Philosophy

Everything revolves around **Spaces**.

Projects organize Buildings.

Buildings organize Floors.

Floors organize Wings.

Wings organize Spaces.

Construction activities occur inside Spaces.

Every Space functions as a digital twin of its physical counterpart.

---

# Technology Stack

Frontend

- React
- Vite
- TailwindCSS

Backend

- Firebase Firestore
- Firebase Authentication

Hosting

- GitHub Pages

File Storage

- Google Drive

AI

- OpenAI API (future)

---

# Database Philosophy

- Flat Firestore collections.
- Reference IDs instead of nested collections.
- Immutable Progress Records.
- Historical data is never overwritten.
- Large files remain in Google Drive.
- Firestore stores metadata only.

---

# UI Philosophy

Inspired by:

- Notion
- VS Code
- Procore
- AutoCAD

Characteristics

- Clean
- Minimal
- Professional
- Desktop-first
- Fast
- Context-aware

---

# User Roles

Primary roles include:

- Documentation Assistant
- Electrician
- Engineer
- Foreman
- Supervisor
- HR
- Director

Each role receives its own dashboard and permissions.

---

# Project Hierarchy

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

# Space Workspace

Every Space contains:

- Overview
- Construction Phases
- Activities
- Progress
- Photos
- Assessments
- Issues
- Reports
- Drawings
- Timeline
- AI Summary

---

# Reporting Philosophy

Reports are generated from existing project data.

Reports never own project information.

Progress Records remain the source of truth.

---

# File Storage

UltraFlow stores structured data in Firestore.

Files are stored in Google Drive.

Supported file types include:

- Photos
- Reports
- Drawings
- Assessments
- Inspection Sheets
- Certificates

Firestore stores only:

- Drive File ID
- Folder ID
- Metadata
- References

---

# AI Responsibilities

AI should assist users by:

- Summarizing project progress.
- Improving report wording.
- Generating reports.
- Searching project information.
- Answering project questions.
- Highlighting inconsistencies.
- Providing recommendations.

AI shall NEVER modify project data without explicit user confirmation.

---

# Development Rules

When generating code:

- Follow the documented architecture.
- Never change entity names.
- Never rename collections.
- Never invent undocumented entities.
- Use reusable components.
- Keep business logic separate from UI.
- Prefer maintainability over cleverness.
- Follow React best practices.
- Use TypeScript-ready architecture where possible.

---

# Security Rules

Never hardcode credentials.

Always use placeholders or environment variables.

Examples:

<FIREBASE_API_KEY>

<FIREBASE_PROJECT_ID>

<GOOGLE_DRIVE_FOLDER_ID>

<OPENAI_API_KEY>

---

# Future Modules

UltraFlow has been designed for future expansion.

Potential modules include:

- Inventory Management
- Material Tracking
- Labour Tracking
- Attendance
- Cost Management
- Quality Assurance
- Safety Management
- BIM Integration
- QR Code Navigation
- IoT Monitoring
- Client Portal

---

# AI Prompting Rule

Before generating code or designs, always assume the following documents have been read:

- SRS.md
- Roadmap.md
- Architecture-Decisions.md
- Domain-Model.md
- Database.md
- Entity-Specifications.md
- UI-Architecture.md
- AI_CONTEXT.md

Generated work must remain consistent with those documents.

If documentation and a prompt conflict, ask for clarification rather than making assumptions.
