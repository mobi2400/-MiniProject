# Candidate dashboard

The dashboard opens after sign-in. It shows the candidate's selected job, the latest trustworthy result, and one action that moves preparation forward. Each job has its own status, scores, session history, and revised CV.

## Desktop wireframe

```text
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard   CV & job   Training   Settings        Candidate menu │
├─────────────────────────────────────────────────────────────────┤
│ Reporting Analyst Intern · Example Company      [Switch role ▾] │
│ Preparing · 0 of 2 consecutive qualifying reassessments         │
│                                                                 │
│ Next step                                                       │
│ Practice SQL joins                                              │
│ Your last answer dropped categories with no sales.   [Practice] │
├───────────────────────────────┬─────────────────────────────────┤
│ Skills for this role          │ CV and job match                │
│ SQL joins     62%  Needs work │ CV fit 67% · CV reviewed         │
│ Communication 88%  On track   │ 1 required gap · View evidence  │
│ View skill evidence           │ Review suggested edits          │
├───────────────────────────────┴─────────────────────────────────┤
│ Recent sessions                                                 │
│ Reassessment · Graded · Nov 18                  [View feedback] │
│ Guided practice · Assisted · Nov 17             [View feedback] │
│                                                                 │
│ Revised CV · Available after meeting the readiness criteria      │
└─────────────────────────────────────────────────────────────────┘
```

The wireframe uses fictional values and the proposed two-pass pilot rule. The sample scores come from the latest graded reassessment. In the UI, label the session type and date beside the skill scores.

On mobile, stack the role selector, readiness status, and next action first. Follow with skills, CV evidence, sessions, and the revised CV. Present skill and session rows as stacked text with labeled links. Keep the primary action and role selector keyboard accessible, use visible focus, and pair status colors with text. Announce meaningful status changes such as completed grading and export failure through accessible status text.

## Data and actions

| Area | Summary on the dashboard | Detail or destination |
| --- | --- | --- |
| Selected job | Title, employer when available, coverage status, role switcher | Job description, version, assessed requirements, and uncovered competencies |
| Next action | Action label and the reason it matters now | Setup, coverage preview, checkout, practice, assessment, status, or final CV review |
| Readiness | Preparing, pending review, or criteria met. Show verified qualifying attempts against the applicable rule. | Required skills, rubric criteria, disputed results, and the evidence behind the decision |
| Skills | Required competencies first. Show score when graded, assessment type, date, and pending or untested state. | Per-skill history, rubric feedback, answer evidence, and next exercise |
| CV and job match | Source CV label, analysis status, CV-fit score, and highest-priority evidence gap | Source excerpts, extraction corrections, per-requirement matches, and suggested edits |
| Recent sessions | Type, date, status, and a resume or feedback link | Saved draft, submitted result, score breakdown, and review request |
| Revised CV | Qualification condition, generation status, or review and download actions | Evidence-backed changes, accept or decline controls, approved revision, and original CV |
| Purchase and support | Payment state and support reference when the next action depends on it | Offer terms, receipt, refund status, support, and owned data controls |

Display CV fit and assessed performance with distinct labels and timestamps. Use “Untested” for missing evidence and show an actual zero only for a completed grade of zero. Show a progress trend only after comparable independent attempts exist. Provide the same dates and values as text when using a chart.

## Choose the primary action

| Candidate state | Primary action | What to explain |
| --- | --- | --- |
| Setup incomplete | Add CV, review extraction, or add a target job | The first unfinished step and what the candidate needs to provide |
| Role coverage incomplete | View coverage | Which required skills the bank cannot assess and how to choose another role |
| Supported paid preview | View offer | Coverage, price, included usage, and final CV condition |
| Payment pending | Check payment status | That confirmation is pending and where to find the support reference |
| Assessment draft exists | Resume assessment | The selected role and last confirmed save |
| Grading or dispute pending | View status | What is pending and available actions while waiting |
| Graded with a skill gap | Start recommended practice | The specific mistake and skill the exercise addresses |
| Practice finished and fresh items available | Start reassessment | Which skills will be checked and what counts toward readiness |
| Ready with export in progress or failed | View CV status or retry generation | Preserve the readiness result and explain the export state |
| Ready with a generated revision | Review CV changes, then download | Which proposed edits have evidence and which changes the candidate approved |

Use the earliest incomplete prerequisite to choose the action. In an active paid preparation, a saved in-progress attempt takes priority over recommendations for a new one. Keep completed feedback accessible during grading and export. On role switch, load the selected role's data and clear the prior role's cards during loading. Give empty states a setup action and failed loads a retry action.
