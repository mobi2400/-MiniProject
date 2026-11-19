# Candidate application UI

## Scope and page count

The proposed first release has **13 candidate-facing page templates**. Each job preparation reuses the same screens. Sign-in and registration share an account page. Diagnostic, guided practice, and reassessment share a session page. A provider-hosted payment screen, if used, sits outside this count.

First visit: homepage → account → profile → dashboard → CV and job setup → analysis → coverage and offer → training → session → feedback. Returning candidates enter through the dashboard and resume the selected role. A qualifying result opens revised CV review. Account settings and support stay available throughout the signed-in journey.

## Page inventory

Routes are proposed Next.js paths. In the table, the prefix R means `/preparations/[id]`. Every role-specific screen carries the role title and scopes its data to that preparation.

| # | Screen and route | Layout and information | Primary interaction and recovery |
| --- | --- | --- | --- |
| 1 | Home · `/` | Lead with who the app helps and the result they can obtain. Show one fictional job requirement moving through CV comparison, practice, and final revision. Explain the readiness condition. | Start preparation opens account entry. Returning candidates can sign in directly. |
| 2 | Account · `/account` | One labeled form with sign-in and registration modes. Preserve the intended destination across authentication. | On success, open profile setup for a new candidate or the requested owned page for a returning candidate. Show field errors beside the inputs. |
| 3 | Candidate profile · `/profile` | Group identity and career details in a short form. Label optional fields and distinguish candidate-entered information from extracted CV facts. | Save profile and continue. Keep entered values visible if saving fails. |
| 4 | Dashboard · `/dashboard` | Role selector, next action, readiness, assessed skills, CV fit, recent sessions, and final CV status. Stack in that order on narrow screens. | Resume the highest-priority step. A first-time candidate gets an add-CV action. See the [dashboard specification](candidate-dashboard.md). |
| 5 | CV and job setup · `R/setup` | Start a preparation from the dashboard. Show file requirements and data handling before upload. Preview the source and extracted claims side by side, followed by the target job description and title. | Correct extraction, confirm inputs, and run comparison. For unreadable files, retain the job description and offer replacement upload. |
| 6 | CV analysis · `R/analysis` | Show CV-fit score, input versions, then required and preferred requirements. Each row expands to reveal match level, source excerpt, gap, and suggested edit. | Inspect evidence or correct a source claim. Show analysis in progress, stale, failed, or current. Continue to coverage once the role is defined. |
| 7 | Coverage and offer · `R/offer` | Display required skills, available assessment coverage, qualifying conditions, total price, limits, and refund terms. Show receipt and order status after checkout. | Purchase a supported preparation. Incomplete coverage links back to job setup. Pending payments offer status and a support reference. |
| 8 | Training plan · `R/training` | List skills in practice priority order with the evidence behind each recommendation. Show saved attempt, next activity, and dated session history. | Resume an open draft or preview the next session's type, scope, and estimated duration. Explain unavailable questions or pending grades inline. |
| 9 | Session · `R/sessions/[attemptId]` | Focused question workspace, role, mode, progress, answer control, save status, and review step. | Save and exit, move between questions, review, then submit once. Full behavior appears below. |
| 10 | Session feedback · `R/sessions/[attemptId]/feedback` | Show grading status, skill scores, answer excerpts, rubric evidence, priority gap, and one next exercise. Expand a criterion to request review. | Continue practice, start reassessment, or open CV review when qualified. A pending grade stays accessible after reload. |
| 11 | Skill progress · `R/progress` | Compare dated independent attempts for the selected competency. Label assisted practice and rubric changes. Supply a text table for plotted points. | Select a competency or open the underlying feedback. With one attempt, show the baseline and next exercise. |
| 12 | Revised CV · `R/revised-cv` | Before qualification, explain the unlock condition. Once ready, place original wording, proposed wording, and source evidence together. Stack each change on mobile. | Accept or decline edits and download the approved revision. A failed export offers retry while preserving readiness and edit choices. |
| 13 | Settings and support · `/settings` | Group profile link, purchases and receipts, support references, and preparation data controls. Identify each preparation by role and source CV. | Inspect a receipt, request help, or confirm deletion of a named preparation after seeing its effects. |

## Navigation and visual hierarchy

Desktop navigation follows the dashboard vocabulary: Dashboard, CV & job, Training, and Settings. CV & job opens setup until inputs are confirmed, then analysis. Training opens the selected plan, with links to progress and feedback. The role switcher lists employer and role together where available. When switching, clear previous role content while the destination loads. A deep link that requires authentication returns to the owned destination after sign-in.

Use a neutral light surface, dark text, a single indigo action color, and semantic status colors paired with words or icons. Use Inter for reading and controls, with a monospace face for code answers. Use a 16 px base size, left-aligned prompts, visible focus outlines, and a comfortable reading width of about 65 characters. Reserve filled buttons for the primary action. On mobile, collapse global navigation into a labeled menu and keep the role and current page visible.

## Session page

The example shows a diagnostic for a reporting internship. The input table and question are fictional.

```text
Reporting Analyst Intern     Diagnostic                 Save and exit
Question 2 of 5              SQL joins                  1 of 5 answered
-----------------------------------------------------------------------
Which customers remain in the report?                 Questions
                                                      1  Answered
Customers     Orders                                  2  Current
Asha          Asha   2                                3  Unanswered
Dev                                                   4  Unanswered
                                                      5  Unanswered
The report needs one row per customer, including
customers with no orders. Write a query and explain
how Dev appears in your result.

SQL answer                 [ multiline code input                  ]
Explanation                [ multiline text input                  ]
Saved at 10:42

Previous                                              Next question
```

**Entering.** Show the role, mode, competencies, estimated duration, answer formats, and save policy before starting. For reassessments, explain that fresh independent answers count toward readiness. Starting allocates the attempt once. Opening an existing draft restores its items, order, assistance history, and last confirmed answers.

**Answering.** Give each question a heading, task, input data, and clearly labeled answer area. Use radio controls for single-choice items, a numeric input with units when applicable, and text or code fields for explanations and work samples. Show question position and answered count independently. Selecting a question in the navigator moves focus to its heading. Previous and Next navigate within the same attempt.

**Coaching.** Guided practice exposes a hint on request and can show a worked example after a repeated mistake. Label the activity Assisted when help is used. Diagnostic and qualifying reassessment use the question workspace with coaching released in feedback after submission. A candidate who needs to stop can save and exit to the plan.

**Saving.** Show Saving during a write and Saved only on server acknowledgment. If a save fails, keep the typed answer visible with a retry control. Explain unsaved changes before exit. If another tab has a newer revision, offer to inspect the saved answer and explicitly reapply the local edit. Save-and-exit returns to the plan after confirmation.

**Reviewing.** On the last question, replace Next with Review answers. List each item as answered or unanswered and link back to edit. Explain how intentional skips are scored and require confirmation for those skips. A failed save keeps the candidate in review with a way to retry. Final submission freezes the confirmed answers and opens grading status on the feedback page. Duplicate clicks or reloads resolve to the same submission.

**Receiving feedback.** For pending grading, show submission confirmation, the role and attempt reference, and a return-to-dashboard link. Once graded, lead with one piece of answer-specific feedback and a next action. A readiness-affecting dispute displays the pending review status. Route a qualifying candidate to final CV review when the engine records readiness.

**Mobile and keyboard use.** Replace the side navigator with a Questions button that opens an accessible list above the prompt. Keep input data close to its question and allow wide data tables to scroll within their container. Place actions after the answer in reading order so the on-screen keyboard leaves the focused field reachable. Return focus to the triggering control when a dialog closes. Announce save failure, submission, and completed grading without moving focus while someone is typing.

## Prototype walkthrough

Test with one first-time student and one returning candidate scenario. On desktop and at a narrow mobile width, follow setup through feedback, interrupt a draft save, resume after reload, intentionally skip one item, and inspect the submission while grading is pending. Then switch roles from the dashboard and verify that results and revised CV access belong to the selected preparation. Record observed behavior against [features.json](../features.json).
