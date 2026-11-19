# CV and training workflow

The [CV analysis](ai-cv-parsing-and-scoring.md) and [training engine](training-engine.md) share the same target job and its requirements. Each contributes different evidence to the candidate's preparation.

| Stage | What passes to the next stage | What the candidate sees |
| --- | --- | --- |
| Compare the CV with the job | Job requirement IDs, CV match levels, and evidence references | CV-fit score, gaps, and suggested edits |
| Start the diagnostic | Required competencies mapped to job requirements. CV gaps help prioritize questions. | Questions for the selected role, including skills the CV already demonstrates |
| Practice and reassess | Verified scores by competency and the highest-priority gaps from the latest session | Session feedback, targeted practice, and fresh assessment questions |
| Complete training | A recorded readiness result for the selected job after a completed, qualifying reassessment | Readiness result and access to the updated CV when generation succeeds |

## Keep the evidence connected

The detailed records and asynchronous handoffs are specified in [application architecture](architecture.md).

Link the preparation record to the candidate, job description version, and source CV version. Carry the job requirement IDs from the comparison into the training blueprint and associate each assessment result with its competency. Use the diagnostic and subsequent scored attempts to choose practice priorities. Keep the CV-fit and assessment scores separate. If the candidate switches target jobs, evaluate readiness for the new job using its own requirements and assessment results.

For example, a reporting internship may require SQL joins. If the CV mentions a database project but provides little evidence of joins, prioritize joins in the diagnostic. If the candidate struggles to retain unmatched rows, assign targeted practice and reassess with a fresh query. After the candidate meets the role's readiness criteria and the final session ends, provide a revised CV that clarifies the original project using supported details. A passed exercise can support a clearly labeled practice activity when appropriate, while workplace claims require their own evidence.

## Deliver the updated CV

Make the updated CV available when the qualifying session is complete and readiness has been recorded for that target job. Earlier sessions provide feedback and suggested edits. Generate the final revision from the source CV, supported profile details, and evidence-backed suggestions. Preserve the original CV and make the revision available from the completed preparation result. The final file format is open.

If CV generation fails after readiness is recorded, keep the result visible and let the candidate retry generation from the completed preparation result. Repeated retries should reuse any revision already generated for that result.

## Verify the handoff

Use a target job with a known CV evidence gap. Confirm the requirement appears in the diagnostic and that an assessment weakness drives the next practice exercise. Complete a below-criteria session and check that feedback is available. Then finish a qualifying reassessment, verify the updated CV is available for that role, and check that it contains only supported claims. Exercise a failed generation and confirm it can be retried from the completion result.
