# Technical notes

## Agreed foundation

- Next.js for the application, with a public homepage at `/`.
- JWT-based authentication for access to candidate features.
- AI integration for the CV and job preparation workflow. The provider and model are open decisions.

## Dependencies

See [application architecture](architecture.md) for service boundaries, records, lifecycle, and recovery contracts.

See [AI CV parsing and scoring](ai-cv-parsing-and-scoring.md) for the proposed extraction pipeline, comparison rubric, and verification cases.

See [Training engine design](training-engine.md) for role-based question selection, grading, feedback, and reassessment.

| Workflow | What it needs |
| --- | --- |
| Public homepage | The product brief and a runnable Next.js baseline |
| Candidate profile | Sign-in and profile storage |
| CV extraction and target job submission | A candidate profile and decisions on supported inputs |
| CV comparison and suggestions | Extracted CV details, a target job description, and a CV-fit rubric |
| Role assessment | A target job description and an assessment format and rubric |
| Practice and reassessment | Assessment feedback, role-specific practice, and readiness criteria |

The data store, authentication session details, AI provider, and CV retention policy are open. Enforce ownership checks on server-side candidate operations. Keep credentials server-side and keep CV contents out of logs, as required by [AGENTS.md](../AGENTS.md).

## Local setup and verification

The repository currently has no application or initialization script. When the Next.js baseline lands, add the actual setup and start commands, required configuration names, and test commands here.

Use sample data with a known CV skill and experience entry, a job requirement supported by the CV, and one missing from it. Verify the comparison shows both cases. When the assessment is available, use answers that fall below and meet the agreed readiness criteria to exercise both outcomes. Follow the verification workflow in [AGENTS.md](../AGENTS.md) and record results against [features.json](../features.json).
