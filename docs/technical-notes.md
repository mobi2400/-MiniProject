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

## Six-phase implementation roadmap

Begin with the Phase 1 Next.js scaffold and public homepage. Each phase builds on the previous one and delivers a candidate journey that can be exercised in a browser. Implement one ready feature at a time and run the applicable unit, integration, and browser checks before updating its status.

### Phase 1 · Foundation and authentication

- **Frontend.** Public homepage, account, profile, dashboard shell, and empty preparation view.
- **Backend.** Scaffold Next.js and document local startup. Add migrations, account sessions using JWTs and secure cookies, ownership checks, and CI for lint, types, build, and browser smoke tests.
- **AI and content.** Use local fixtures for pending scores and preparation states.
- **Exit check.** Create an account, save a profile, resume an owned preparation after signing back in, and verify another candidate cannot open it.

Feature IDs: `home-explains-application`, `create-candidate-profile`, `resume-private-preparation`.

### Phase 2 · CV intake and job comparison

- **Frontend.** CV upload and evidence review, pasted job setup, analysis and coverage pages.
- **Backend.** Add private file storage, versioned CV and job records, and durable worker jobs with deduplication, retry, and stale-result checks.
- **AI and content.** Extract structured evidence, map job requirements, and generate supported suggestions. Validate model output and compute CV-fit scores on the server. Use approved question inventory for coverage.
- **Exit check.** Upload a fixture CV, correct an attribution during processing, and verify the current comparison and coverage refer to the correct versions.

Feature IDs: `extract-cv-details`, `submit-target-job`, `score-cv-fit`, `suggest-cv-improvements`, `preview-role-coverage`, `correct-cv-evidence`, `protect-preparation-revisions`.

### Phase 3 · Training, grading, and readiness

- **Frontend.** Training plan, session workspace, review and submit, feedback, disputes, and skill progress.
- **Backend.** Persist versioned question sets, drafts, frozen submissions, ordered grades, and readiness decisions. Use explicitly granted test access until checkout is implemented.
- **AI and content.** Use reviewed questions, deterministic grading where possible, and rubric-bound AI grading with human review for disputed answers.
- **Exit check.** Resume on mobile, submit once across tabs, recover interrupted grading, and verify practice and out-of-order grades cannot award readiness early.

Feature IDs: `assess-role-readiness`, `review-training-session-feedback`, `practice-and-reassess`, `view-role-progress`, `resume-pending-grade`, `challenge-assessment-result`, `resume-assessment-draft`, `practice-a-specific-error`, `verify-readiness-sequence`, `review-and-submit-session`.

### Phase 4 · Revised CV and dashboard integration

- **Frontend.** Complete role switching and next-action wiring. Add final CV review, edit approval, export status, retry, download, and preparation deletion.
- **Backend.** Enforce readiness at export, preserve approved edits across retries, authorize private downloads, and block stale output after deletion. Complete the export and deletion portions of the Phase 2 revision tests.
- **AI and content.** Propose evidence-backed changes. Render the approved revision from the frozen edit set and supported claims.
- **Exit check.** Qualify for one role, approve edits, recover a failed export, switch roles, and verify deletion during export does not restore data.

Feature IDs: `receive-updated-cv-after-readiness`, `approve-final-cv-edits`, `recover-final-cv-export`, `delete-preparation`, `view-candidate-dashboard`.

### Phase 5 · Job discovery and listing tailoring

- **Frontend.** Add editable search titles, filters, source status, saved listings, keyword review, and listing-specific resume variants.
- **Backend.** Integrate approved sources through server adapters. Normalize and deduplicate listings, track freshness, and snapshot the posting when selected. Reuse ownership, evidence, approval, and export controls.
- **AI and content.** Suggest titles and keyword coverage with evidence. Check manual and AI edits against confirmed facts before export.
- **Exit check.** Merge two fixture feeds through a timeout and retry. Close a saved listing without losing its preparation. Verify two variants remain isolated and unsupported manual claims are flagged before export.

Feature IDs: `choose-job-search-titles`, `aggregate-job-listings`, `tolerate-source-failure`, `handle-stale-listings`, `select-listing-as-target-job`, `analyze-ats-keywords`, `confirm-skills-before-adding`, `generate-tailored-resume-microedits`, `approve-tailored-edits`, `manage-resume-variants-per-listing`, `protect-job-search-data`.

### Phase 6 · Payments and pilot release

- **Frontend.** Finish offer, checkout, payment status, receipts, refund status, and support references.
- **Backend.** Wire verified payment events to scoped entitlements and rehearse reconciliation, refunds, backup restoration, and worker recovery. Monitor job latency, errors, and per-candidate costs.
- **AI and content.** Compare grading with reviewed answers near the readiness boundary and measure model costs across repeat attempts.
- **Exit check.** Rehearse delayed and duplicate payments, a refund followed by an old success event, and the full candidate journey in staging. Release paid access after the pilot checks pass.

Feature IDs: `purchase-role-preparation`, `recover-paid-access`.

For planning, work on listing-specific variants as drafts before readiness and apply the existing readiness gate to downloadable revisions. Confirm this product decision before enabling the Phase 5 export path. Keep selected listing snapshots stable across source edits and closures. Confirm source access before connecting live feeds. The Phase 2 public coverage preview can use fixtures until the approved bank is available. A live offer depends on actual coverage.

## Local setup and verification

Set `GREENHOUSE_BOARDS` to a comma-separated list of permitted employer board tokens and display names, such as `board-token:Employer Name`. Job search fetches public board listings and matches candidates' saved titles on the application server. Job boards receive no candidate search titles or CV data. [Greenhouse Job Board API](https://docs.greenhouse.io/job-board)

AI comparison is optional. Set `OPENAI_API_KEY` and `OPENAI_COMPARISON_MODEL` on the server to enable generation of candidate-reviewed drafts. Selecting the AI draft action sends the job description and bounded CV evidence excerpts to OpenAI. The manual comparison path is available without provider credentials. Before enabling the feature in a public pilot, verify the selected model on synthetic CV/job pairs and confirm provider data handling and usage limits.

Use Node.js 24 or later and npm. From the repository root, run `npm ci`, then `npm run dev` and open `http://localhost:3000`. The public homepage requires no environment variables. For accounts, copy `.env.example` to `.env.local` and set a random `SESSION_SECRET` using the command in the example. Account and profile records use SQLite at `.data/miniproject.sqlite` by default. Set `DATABASE_PATH` to use a different persistent location.

Run `npm run lint`, `npm run typecheck`, and `npm run build` to check the application. Serve the production build with `npm start` behind HTTPS for secure session cookies. SQLite is the current single-instance choice. Before a public pilot, configure persistent storage, backup, sign-in throttling, and account recovery.

Use sample data with a known CV skill and experience entry, a job requirement supported by the CV, and one missing from it. Verify the comparison shows both cases. When the assessment is available, use answers that fall below and meet the agreed readiness criteria to exercise both outcomes. Follow the verification workflow in [AGENTS.md](../AGENTS.md) and record results against [features.json](../features.json).
