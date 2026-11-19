# First paid pilot

The proposed buyer is a student preparing for a specific reporting or data analyst internship. The SQL reporting examples already span the CV and training designs, making this a practical role to test. A one-time purchase for one supported job description is a hypothesis to validate with candidates.

The deliverable is a record of preparation for that job and a revised CV after qualification. For example, the candidate can follow a SQL requirement from the employer's wording to their first attempt, see where their query dropped records, and inspect a later independent answer that preserved those records. An edit describing their database project must still cite evidence from that project.

## Gaps found in the candidate journey

| Gap | Pilot requirement | Evidence to collect |
| --- | --- | --- |
| The profile journey starts after sign-in and training spans several visits. | Provide account entry and resume the selected role at its last completed session. | Restore a session after sign-out and verify isolation with a second account. |
| A job description can demand skills the question bank cannot assess. | Check required competency coverage and available fresh items before checkout and reassessment. | Test an unsupported role and an exhausted bank. Give an existing buyer a support or refund route if the service cannot deliver. |
| A parsing mistake can propagate into the score and final CV. | Show the original excerpt, accept corrections, and recompute affected comparisons. | Follow one corrected project attribution through to the export. |
| A single score obscures improvement and can imply a hiring prediction. | Show dated independent attempts by competency, rubric version, and pending skills. Describe readiness as meeting the target role's preparation rubric. | Verify assisted practice, role changes, and incompatible rubric versions are excluded from improvement claims. |
| The qualifying session can finish before a usable document exists. | Preserve readiness across retries and let candidates accept or decline each proposed change before download. | Recover a failed export and inspect the resulting document. |
| A candidate hands over personal material before understanding its lifecycle. | Explain AI processing, retention, deletion, and the support contact before upload. Enforce ownership throughout. | Check deletion against saved links, derived artifacts, and the published retention process. |

## What the buyer sees

Offer a free coverage preview with a fictional sample report. Before payment show the price, currency, duration, practice allowance, readiness criteria, CV delivery condition, and refund terms. Ensure the purchased allowance supports the qualifying assessments. Specify the remedy if grading, item supply, or export prevents completion. Price, limits, support ownership, retention periods, and refund terms require owner decisions.

## Release sequence and evidence

1. Demonstrate one complete role. Start with a student's project CV, identify a genuine gap, run a diagnostic and targeted practice, verify the independent reassessment, and download a candidate-approved revision.
2. Ask a domain reviewer to grade held-out answers, including alternate correct approaches and weak answers that repeat keywords. Record disagreements near the readiness boundary and revise the rubric before advertising that result.
3. Rehearse successful, cancelled, duplicate and refunded payments, access restoration, failed grading, export retries, deletion, and account isolation. Assign owners for question quality and support.
4. Show the sample result and a stated price to pilot candidates. Measure purchases per eligible preview, returns for reassessment, completed downloads, refunds, and improvement on comparable independent tasks. Track AI, payment, content review, and support costs per paying candidate including repeat attempts. Use actual revenue and cost to decide whether to expand role coverage.

Implementation and paid-pilot evidence are pending. [Feature backlog](../features.json)

## Field rehearsal before the first sale

Use a fictional candidate and the provider's test environment. Assign one named person per duty before the rehearsal. One person may cover several duties. Record the build, fixture, expected result, observed result, owner, and retest outcome for each row.

| Failure to rehearse | Engineering behavior | Field response and evidence |
| --- | --- | --- |
| Buyer paid, closed the tab, then returned before confirmation arrived | Persist the order before redirect. Reconcile provider-confirmed amount, currency, order and account. Grant access once. A late success event cannot reopen a refunded order. | Payment owner looks up the order by support reference. Demonstrate recovery from a delayed confirmation and a refund followed by an old notification. |
| The grading service stopped just after the candidate submitted | Save the submitted answers and attempt together before acknowledging receipt. Retry grading against the frozen rubric and attempt ID. Apply the score and allowance debit once. | Operations owner finds the pending job by attempt reference, restores the worker, and verifies the candidate can see the result after reload. |
| An open-ended answer received a plausible but incorrect grade | Let candidates challenge a specific criterion. Give the reviewer the answer, rubric version, and grading evidence. Preserve the original decision and recompute dependent results after a correction. | Content owner handles a valid alternate answer and explains the change. Publish the support channel and review turnaround before checkout. |
| The candidate edits a CV while the old analysis is running, or deletes it during export | Bind jobs to the owner, preparation, source versions, and operation ID. Before publishing, check that the preparation exists and the input versions still match. Discard obsolete output and clean up produced files. | Engineering owner completes jobs in reverse order and verifies the current report and saved download links after reload. |

For support, expose the operation reference, state, timestamps, retry count, and error category. Keep CV text, candidate answers, and payment credentials out of routine diagnostics. If a provider outage prevents delivery, pause affected new purchases, show existing buyers their saved progress and support route, and reconcile pending work before reopening sales.

Use one additional coaching exercise in the pilot walkthrough. Give a candidate who has memorized a worked example an unfamiliar problem testing the same skill. A reviewer checks that names and numbers alone do not distinguish the questions. Record whether the candidate can explain and apply the concept independently. Treat this observation as pilot evidence when deciding whether the threshold supports the advertised readiness claim.
