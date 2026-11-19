# AI CV parsing and scoring

This is a proposed design for the CV extraction and CV-fit features in [features.json](../features.json). The score measures how much of a specific job description the candidate's CV demonstrates. Role readiness is assessed separately through practice and assessments.

## Parse the CV

1. Verify the candidate owns the upload and validate the file against the supported types and size limit. Use a document parser to extract text and retain page or section references where available. If usable text cannot be extracted, explain the upload issue and let the candidate retry.
2. Pass the relevant text to the AI as document data. Ask it to return structured fields for skills, work and internship experience, projects, education, and certifications. Keep contact details out of the model input wherever possible because they are unnecessary for job fit.
3. Require evidence for each extracted claim, such as an exact excerpt and a page or section reference when available. Leave unclear fields empty. Validate the response against the expected schema and verify that cited excerpts occur in the extracted text before displaying claims.
4. Show the extracted details and their source excerpts to the candidate. If extraction fails or the evidence cannot be validated, show a retryable error or identify the fields that need review.

Treat text from CVs and job descriptions as untrusted input. Keep it out of application logs and give extraction and comparison calls only the data needed for the task.

## Compare the CV with the target job

1. Use AI to identify distinct requirements from the job description. Preserve the wording and distinguish explicit required and preferred items. Flag ambiguous items for review before including them in the rubric.
2. For each requirement, ask AI to return a match level, an explanation, and references to any supporting CV evidence. Validate the requirement IDs and evidence references before scoring.
3. Calculate the total in application code with a versioned rubric. Return the overall score alongside the per-requirement results so the candidate can see what contributed to it.

| Match level | Meaning | Proposed credit |
| --- | --- | --- |
| Demonstrated | The CV provides evidence covering the requirement. | 1 |
| Partially demonstrated | The CV provides related or incomplete evidence. | 0.5 |
| No evidence found | The CV provides no usable evidence for the requirement. | 0 |

The proposed calculation is `round(100 × sum(weight × credit) / sum(weight))`. As a starting example, assign weight 2 to required items and weight 1 to preferred items. If a required skill is demonstrated and a preferred skill has no evidence, the resulting score is 67 out of 100. If the job description yields no scorable requirements or the analysis fails validation, show that a score is unavailable.

## Explain gaps and suggest changes

- For partial matches, show the supporting excerpt and explain which part of the requirement still needs evidence.
- For missing evidence, describe the gap in the CV. Suggest adding a relevant example if the candidate has one, or practicing the skill if they need to develop it.
- Suggest rewrites only from facts supported by the CV or candidate profile. Any new metric, skill, qualification, or experience needs supporting evidence.

## Provide the updated CV after training

Show suggested edits during preparation. Provide the updated CV after the qualifying training session ends and the candidate is marked ready for the target job. Use the candidate's source CV and supported profile details to generate the revision. Keep training accomplishments accurately labeled and preserve the original CV. See the [CV and training workflow](cv-and-training-workflow.md) for the handoff and retry behavior.

## Verify before release

- Use a sample CV with a known skill and experience entry. Confirm the extraction shows both and links them to the correct evidence.
- Use a job description containing a demonstrated, partial, and missing requirement. Check the classifications, displayed evidence, and score against a hand-calculated result.
- Exercise unsupported or unreadable uploads, invalid model responses, and job descriptions with no scorable requirements. Check that each outcome produces usable feedback.

Open decisions include supported file formats, whether to support scanned documents with OCR, the AI provider, retention rules, and final scoring weights.
