import { readTargetJob } from "./preparations";
import { readCv } from "./cv";
import { one } from "./db";
import { hasReadiness, readDiagnostic, readReassessments, readTrainingRequirements } from "./training";
import { hasCoverage } from "./training-bank";

export type JourneyStage = {
  step: number; // 1 to 5
  name: string;
  nextAction: {
    label: string;
    href: string;
  };
  backAction?: {
    label: string;
    href: string;
  };
};

export const STAGES = [
  { step: 1, name: "Job description" },
  { step: 2, name: "Your CV" },
  { step: 3, name: "CV match" },
  { step: 4, name: "Skill practice" },
  { step: 5, name: "Revised CV" },
] as const;

export async function getStage(accountId: string, preparationId: string): Promise<JourneyStage> {
  const base = `/preparations/${preparationId}`;
  const job = await readTargetJob(accountId, preparationId);
  const cv = await readCv(accountId, preparationId);

  // Default stage 1 if no job exists yet or only job exists without CV
  if (!job) {
    return {
      step: 1,
      name: "Job description",
      nextAction: { label: "Save job description", href: "/preparations/new" },
    };
  }

  if (!cv) {
    return {
      step: 1,
      name: "Job description",
      nextAction: { label: "Next: Upload your CV", href: `${base}/setup` },
      backAction: { label: "Back to preparations", href: "/dashboard" },
    };
  }

  // Check if comparison exists
  const comparison = await one<{ score: number }>(
    `SELECT score FROM cv_comparisons WHERE preparation_id = $1 AND cv_version = $2 AND job_version = $3`,
    [preparationId, cv.version, job.version],
  );

  if (!comparison) {
    return {
      step: 2,
      name: "Your CV",
      nextAction: { label: "Next: Compare your CV", href: `${base}/analysis` },
      backAction: { label: "Back to job details", href: `${base}/setup` },
    };
  }

  // Check practice and readiness
  const diagnostic = await readDiagnostic(accountId, preparationId, job.version);
  const attempts = await readReassessments(accountId, preparationId, job.version);
  const required = await readTrainingRequirements(accountId, preparationId, job.version);
  const covered = required.length > 0 && required.every(({ title }) => hasCoverage(title));
  const ready = covered && hasReadiness(attempts);

  if (ready) {
    return {
      step: 5,
      name: "Revised CV",
      nextAction: { label: "Download revised CV", href: `${base}/revised-cv` },
      backAction: { label: "Back to skill check", href: `${base}/reassessment` },
    };
  }

  if (diagnostic?.submittedAt) {
    return {
      step: 4,
      name: "Skill practice",
      nextAction: {
        label: attempts.length ? "Continue skill checks" : "Next: Go to skill check",
        href: `${base}/reassessment`,
      },
      backAction: { label: "Back to CV match", href: `${base}/analysis` },
    };
  }

  return {
    step: 3,
    name: "CV match",
    nextAction: { label: "Next: View practice available", href: `${base}/offer` },
    backAction: { label: "Back to CV experience", href: `${base}/setup` },
  };
}
