# Training engine design

This proposal covers role assessment and the practice loop. A candidate's training score measures performance on exercises for their selected role. The CV-fit score can help choose where to start. Readiness depends on demonstrated assessment performance.

## Build a role blueprint

Extract the role title, expected seniority, and job tasks from the submitted job description. Map explicit requirements to observable competencies. For example, “SQL reporting” becomes “write a grouped query, handle missing values, and explain the result.” Mark competencies as required or preferred based on the description and flag unclear requirements for review.

Include technical or domain tasks, situational judgment, and behavioral questions when the job calls for those skills. Accept examples from coursework, projects, volunteering, and internships. Use the same scoring anchors for equivalent evidence from each setting.

## Frame and select questions

Each item has a competency, job requirement reference, difficulty, prompt, answer format, time estimate, and versioned answer key or scoring rubric. Give candidates enough context to answer and state what they need to produce. For scenario questions, specify the constraints and accept sound alternative approaches. For behavioral questions, ask for the situation, the candidate's own actions, and the outcome or lesson.

Use an approved question bank for scored sessions. AI can draft new items and rubrics, but reviewers should check factual correctness, role relevance, difficulty, and alternate valid answers before approval. Use AI-generated variants for guided practice when they pass checks against a reviewed template. Select and freeze the questions and rubric before a scored attempt begins.

| Session | Selection and coaching |
| --- | --- |
| Diagnostic | Sample required competencies at the target level. Show untested areas as pending. |
| Guided practice | Prioritize the weakest required competency, then revisit a previously practiced skill. Start with a worked example, offer hints on request, and finish with a new exercise. |
| Reassessment | Cover every required competency with fresh questions of comparable difficulty. Release coaching after submission and keep assisted practice results out of the readiness calculation. |

If the bank lacks enough suitable questions, show which competency lacks coverage and keep the readiness decision pending.

## Verify and score answers

| Answer type | Verification |
| --- | --- |
| Multiple choice or numeric | Compare with the stored key or accepted numeric tolerance. |
| Structured work sample | Use reference outputs or deterministic checks when the task allows it. For a SQL task, compare the result with expected rows on controlled fixtures. |
| Technical explanation or scenario | Have AI grade against the item rubric. Require a rating, supporting excerpt, and explanation for each criterion. Check equivalent approaches against the rubric. |
| Behavioral response | Grade the clarity and relevance of the candidate's described actions and outcome. Treat the example as self-reported. |

Use a proposed 0–4 scale with question-specific anchors. A rating of 0 indicates no demonstrated evidence, 1 an attempt with major errors, 2 partial success, 3 that the criterion is met, and 4 that the response meets it and handles relevant constraints or edge cases. Normalize objective checks to the same scale using their stored rubric.

Validate grader output against the allowed ratings and the submitted answer. Keep affected results pending when grading fails, evidence cannot be verified, or a second grading pass materially disagrees on a borderline result. Allow the candidate to request review of a disputed grade. Before release, compare AI ratings with human-graded sample answers, including valid alternate approaches and responses near the proposed threshold.

For each competency, average its verified item ratings and convert to a percentage by multiplying by 25. Use equal competency weights by default and report required and preferred coverage alongside the score. For example, ratings of 3 and 2 for SQL give 62.5%, while ratings of 4 and 3 for communication give 87.5%. With equal weights the overall score is 75%. Display missing or pending competencies explicitly and label an incomplete overall score as provisional.

Proposed readiness rule for pilot testing is at least 75% overall and at least 75% in each required competency on two consecutive, fully graded, unassisted reassessments. Each must use fresh items with sufficient coverage. In the example, SQL remains the next practice priority. The readiness result applies to the assessed role and preparation rubric.

## Give feedback after every session

Count each submitted attempt once, including after a grading retry. Freeze the question family as well as the item version. Exclude previously coached question families from qualifying reassessments when a wording change would reveal the same solution. Check this supply during role coverage preview. For a disputed grade, preserve the original rubric and reviewer decision history and recalculate readiness against the corrected rating.

Show the candidate their overall score when available, scores by competency, untested areas, one demonstrated strength, and the highest-priority gap. For a flagged answer, show the relevant excerpt, what the rubric expected, and one concrete improvement. Show a worked example after submission when it can be shared without revealing reusable assessment items.

End with a next action. For the SQL example, the feedback could read “Your query grouped sales by category. It omitted categories with no sales. Practice preserving those categories with a left join, then try a fresh reporting task.” Record the item and rubric versions with each attempt so later scores can be interpreted against the criteria used.

When the qualifying reassessment ends and readiness is recorded, the completed result provides access to the updated CV once it is generated. See the [CV and training workflow](cv-and-training-workflow.md).

## Verify before release

### Session recovery and scoring rules

Save draft answers with an attempt ID and revision number. Show a saved indicator only after server acknowledgement. Resuming restores the same question order, submitted text or draft text, and assistance history. Reject a stale save with a recoverable conflict. On submission, freeze the last confirmed answer set and acknowledge the submission once. A grading timeout leaves the submission pending. Reuse the original rubric, answer snapshot, and grading configuration when retrying.

The role blueprint specifies the minimum distinct item families per required competency and their target difficulty. Validate the minimum before offering a qualifying session. Reserve a fresh set when the attempt starts and count a family as exposed once its question is shown, including in abandoned attempts. Practice must leave sufficient independent items available for the qualifying sequence.

Pin the criterion weights in the item rubric. For a multi-criterion answer, use the weighted mean of its verified criterion ratings as the item rating. An explicit skip confirmed at submission earns zero. An ungraded answer or missing required item leaves coverage pending. Compare thresholds using unrounded values and round only the displayed score. Grade submitted text as candidate evidence, including when it contains instructions directed at the grader. Validate criterion IDs, ratings, and cited excerpts before committing a result.

For the proposed two-pass pilot rule, evaluate independent attempts for the same job and blueprint version in submission order. A completed below-threshold attempt resets the streak. Practice and abandoned drafts leave it unchanged. A pending grade or open dispute that could change the qualifying pair blocks finalization. Record one readiness decision per qualifying sequence and reuse that decision on retry. After a grade correction, recompute from the affected attempt forward and show which result changed. Supersede an invalidated readiness result and stop pending exports tied to it.

### Adapt practice to the observed mistake

Associate each rubric criterion with a teachable error and an exercise that can test it again. A low SQL score alone gives too little guidance. If the candidate grouped rows correctly but dropped empty categories, show a small input table and ask which rows should survive the join. After a repeated error, walk through the missing row, then change the data and ask the candidate to predict the result. After independent success in practice, schedule a fresh transfer problem. Preserve achieved skills in the plan and revisit them between weak-area exercises.

### Release fixtures

Replay pass/fail/pass with grades arriving in reverse order, a duplicate submission, a disputed boundary rating, and a score that rounds up to the threshold. Compare the resulting streak and unlock decision with a hand-calculated result. Repeat when a new blueprint has different required skills. Before promoting a grading model or rubric, replay reviewed answers and inspect every change that crosses the readiness boundary. Keep the previous configuration available for in-flight attempts.

- Use a sample internship description and check that every scored question maps to an observable job competency.
- Grade correct, partially correct, and alternate valid answers. Check the breakdown against hand-calculated results.
- Complete a weak session and verify the feedback links to targeted practice. Reassess with new items and verify both below-threshold and qualifying outcomes.
- Simulate unavailable items and grading failures. Verify the candidate sees pending coverage or grading and can continue or retry as appropriate.

The initial supported role families, session length, item review ownership, and readiness thresholds still need approval. The structured interview approach draws on job-linked questions and examples for each rating level. [U.S. Office of Personnel Management structured interview guide](https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/guide/)
