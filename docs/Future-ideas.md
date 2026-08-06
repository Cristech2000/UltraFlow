# Feature Proposal — Space Health Score

## Status

Future Consideration

---

## Description

Introduce a **Space Health Score** that evaluates the overall condition of a Space independently from its completion percentage.

While completion indicates how much work has been finished, Health indicates the quality and stability of the Space at its current stage.

A Space may therefore be highly complete but still unhealthy due to unresolved issues or failed inspections.

---

## Purpose

Provide management and engineers with a quick visual indication of construction quality and project risk.

---

## Factors Influencing Health

The Health Score may consider:

- Number of open issues.
- Severity of issues.
- Failed assessments.
- Outstanding snag items.
- Delayed activities.
- Overdue inspections.
- Missing photographic evidence.
- Missing reports.
- Unapproved work.

---

## Example

Space 305

Progress:

82%

Health:

🟢 Excellent

---

Space 210

Progress:

91%

Health:

🔴 Poor

Reason:

- 12 unresolved issues.
- 2 failed inspections.
- 4 overdue activities.

---

## Benefits

- Provides management with a more meaningful project indicator.
- Highlights high-risk areas before project completion.
- Enables AI to prioritize spaces requiring immediate attention.
- Supports predictive project analytics in future versions.

---

## Possible Health Categories

🟢 Excellent

🟡 Good

🟠 Fair

🔴 Poor

⚫ Critical

---

## Future Enhancements

- AI-generated recommendations for improving Health.
- Automatic Health trend graphs.
- Building and Project Health aggregation.
- Health prediction based on historical project data.
