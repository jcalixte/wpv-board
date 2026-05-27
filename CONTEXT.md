# Andon — Weak Point Visualisation

A digital twin of the company's physical Lean/TPS project board. Team members
raise problems about the board itself as they use it; the system aggregates
those reports to reveal which parts of the board are weakest, so the board
product can be radically improved as it rolls out company-wide (Dantotsu).

## Language

**Board**:
The standardised physical project board being deployed across the company; the
product under test. Rendered in the app as ASCII art.
_Avoid_: panel, wall

**Block**:
One of the four named quadrants of the **Board**: _Value for Customer_, _Right
First Time & Just in Time_, _Tech-Enabled Network of Teams_, _Building a
Learning Organisation_.

**Section**:
A single sheet within a **Block** (e.g. _Macroplan_, _Feature Kanban_, _Problem
Solving_), sized A2/A3/A4. The unit a team member clicks and the unit weak-point
analysis aggregates over.
_Avoid_: sheet, paper, tile, zone

**Defect**:
A single reported problem about one **Section** of the **Board** — one team, one
moment, one verbatim. The unit a team member files.
_Avoid_: issue, problem, bug, ticket

**Weak Point**:
A **Section** that accumulates **Defects**. Not filed by anyone; revealed by
analysis (the dashboard's descending-order ranking). "Weak point" names the
problem area, not a single report.

**Andon**:
The act/signal of a team member raising a **Defect** by clicking a **Section**.
Also the name of the reporting app.

**Verbatim**:
The reporter's own words describing a **Defect**, shown in the dashboard modal.
_Avoid_: description, comment, note

**Project**:
The client engagement a reporting team member belongs to (an app built for a
client, for an amount, a duration, a scope). Selected when filing a **Defect**;
remembered for future selection.

**Reporter**:
The `@theodo.com` team member who filed a **Defect**, identified via SSO and
shown on the dashboard. Attribution is transparent (not blameless) by design.

## Relationships

- The **Board** has exactly four **Blocks**
- A **Block** contains one or more **Sections**
- A team member pulls the **Andon** on a **Section** to file a **Defect**
- A **Defect** belongs to exactly one **Section** and one **Project**, and carries one **Verbatim**
- A **Section** that accumulates **Defects** is a **Weak Point**

## Example dialogue

> **Owner:** "Macroplan has 14 **Defects** across 6 **Projects** — that **Section** is a **Weak Point**."
> **Dev:** "So a team member pulled the **Andon** on the Macroplan **Section** 14 times; each is one **Defect** with its own **Verbatim**?"
> **Owner:** "Right. The dashboard ranks **Sections** by **Defect** count descending — that ranking *is* the weak-point analysis."

## Flagged ambiguities

- "problem / issue / defect / weak point" were used interchangeably in the brief
  — resolved: a single report is a **Defect**; a **Section** accumulating defects
  is a **Weak Point**; "issue"/"problem" are avoided aliases.
- A report is about the **Board artifact**, not about the reporter's own project
  work — resolved during design.
