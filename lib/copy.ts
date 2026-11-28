export const copy = {
  // Navigation & stages
  targetJob: "Job you're preparing for",
  targetJobPlural: "Jobs you're preparing for",
  addJobTitle: "Add a job you're preparing for",
  noJobsYet: "No jobs yet. Add a job you're preparing for to get started.",
  noJobsDashboard: "No jobs yet. Add one to start.",

  // CV Evidence
  cvEvidence: "Experience from your CV",
  savedCvNote: (filename: string) => `Saved CV: ${filename}. Upload a new file to replace it.`,

  // Fit & match
  cvFitEstimate: "How well your CV matches this job",
  fitScoreExplanation: "This score shows how many of the job's requirements your CV covers. Required skills count twice.",
  supportsRequirement: "Your CV supports this",
  partlySupportsRequirement: "Your CV partly supports this",
  notInCv: "Not found in your CV",
  compareFirstPrompt: "Compare your CV with this job first to see which skills you can practice.",

  // Skill checks (Diagnostic & Reassessment)
  diagnostic: "Starting skill check",
  reassessment: "Skill check (retake)",
  startDiagnostic: "Start skill check",
  resumeDiagnostic: "Resume starting skill check",
  reviewDiagnostic: "Review starting skill check",
  resumeReassessment: "Resume skill check",
  reviewReassessment: "Review skill check",
  diagnosticFeedback: "Starting skill check feedback",
  reassessmentFeedback: "Skill check feedback",
  practiceFreeDuringPilot: "Practice is free during the pilot.",
  missingSkillPractice: (skill: string) => `We don't have practice for ${skill} yet. You can still use the other steps.`,
  roleCoverage: "Practice available",
  someSkillsNoPractice: "Some skills don't have practice yet. You can still complete the other steps.",
  practiceHowItWorks: "How practice works",

  // Readiness & status
  readinessMet: "Ready to download your revised CV",
  inProgress: "In progress",
  untested: "Not started yet",

  // Revised CV
  revisedCvHeading: "Review your revised CV",
  revisedCvIntro: "These are the experience lines we suggest highlighting, based on your skill checks.",
} as const;
